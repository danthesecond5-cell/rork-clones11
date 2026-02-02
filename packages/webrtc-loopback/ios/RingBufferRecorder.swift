import Foundation
import AVFoundation
import CoreVideo

final class RingBufferRecorder {
  private let queue = DispatchQueue(label: "webrtc.loopback.ringbuffer")
  private let width: Int
  private let height: Int
  private let fps: Int
  private let segmentSeconds: Double
  private let maxSegments: Int
  private var writer: AVAssetWriter?
  private var input: AVAssetWriterInput?
  private var adaptor: AVAssetWriterInputPixelBufferAdaptor?
  private var segmentStartTime: CMTime?
  private var segments: [URL] = []

  init(width: Int, height: Int, fps: Int, ringBufferSeconds: Double, segmentSeconds: Double) {
    self.width = width
    self.height = height
    self.fps = max(1, fps)
    self.segmentSeconds = max(1.0, segmentSeconds)
    self.maxSegments = max(1, Int(ceil(ringBufferSeconds / segmentSeconds)))
  }

  func append(pixelBuffer: CVPixelBuffer, timeNs: Int64) {
    queue.async { [weak self] in
      self?._append(pixelBuffer: pixelBuffer, timeNs: timeNs)
    }
  }

  func stop() {
    queue.sync {
      finishCurrentSegment()
      segments.removeAll()
    }
  }

  func getSegments() -> [String] {
    return segments.map { $0.path }
  }

  func clearSegments() {
    queue.sync {
      for url in segments {
        try? FileManager.default.removeItem(at: url)
      }
      segments.removeAll()
    }
  }

  private func _append(pixelBuffer: CVPixelBuffer, timeNs: Int64) {
    let time = CMTime(value: timeNs, timescale: 1_000_000_000)
    if writer == nil {
      startNewSegment(at: time)
    }

    guard let writer = writer, let input = input, let adaptor = adaptor else { return }
    if writer.status == .failed || writer.status == .cancelled {
      finishCurrentSegment()
      return
    }

    if input.isReadyForMoreMediaData {
      adaptor.append(pixelBuffer, withPresentationTime: time)
    }

    if let start = segmentStartTime {
      let elapsed = CMTimeGetSeconds(time - start)
      if elapsed >= segmentSeconds {
        rotateSegment()
      }
    }
  }

  private func startNewSegment(at time: CMTime) {
    let fileName = "loopback_segment_\(Int(Date().timeIntervalSince1970 * 1000)).mp4"
    let url = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent(fileName)
    try? FileManager.default.removeItem(at: url)

    guard let writer = try? AVAssetWriter(outputURL: url, fileType: .mp4) else { return }
    let settings: [String: Any] = [
      AVVideoCodecKey: AVVideoCodecType.h264,
      AVVideoWidthKey: width,
      AVVideoHeightKey: height,
    ]
    let input = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
    input.expectsMediaDataInRealTime = true
    let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [
      kCVPixelBufferPixelFormatTypeKey as String: Int(kCVPixelFormatType_32BGRA),
      kCVPixelBufferWidthKey as String: width,
      kCVPixelBufferHeightKey as String: height,
    ])
    if writer.canAdd(input) {
      writer.add(input)
    }
    writer.startWriting()
    writer.startSession(atSourceTime: time)

    self.writer = writer
    self.input = input
    self.adaptor = adaptor
    self.segmentStartTime = time
  }

  private func rotateSegment() {
    finishCurrentSegment()
    if segments.count > maxSegments {
      let overflow = segments.count - maxSegments
      let toRemove = segments.prefix(overflow)
      toRemove.forEach { try? FileManager.default.removeItem(at: $0) }
      segments.removeFirst(overflow)
    }
  }

  private func finishCurrentSegment() {
    guard let writer = writer, let input = input else { return }
    input.markAsFinished()
    writer.finishWriting {
      if writer.status == .completed {
        self.segments.append(writer.outputURL)
      }
    }
    self.writer = nil
    self.input = nil
    self.adaptor = nil
    self.segmentStartTime = nil
  }
}
