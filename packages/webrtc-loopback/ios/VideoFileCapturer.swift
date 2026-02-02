import Foundation
import WebRTC
import AVFoundation

final class VideoFileCapturer: RTCVideoCapturer {
  private let queue = DispatchQueue(label: "webrtc.loopback.filecapturer")
  private var player: AVPlayer?
  private var output: AVPlayerItemVideoOutput?
  private var timer: DispatchSourceTimer?
  private var fps: Int = 30
  private var loop: Bool = true
  private var lastTick: CFTimeInterval = 0
  var onFrame: ((CVPixelBuffer, Int64) -> Void)?

  func start(url: URL, fps: Int, loop: Bool) {
    self.fps = max(1, fps)
    self.loop = loop
    stop()

    let asset = AVURLAsset(url: url)
    let item = AVPlayerItem(asset: asset)
    let attrs: [String: Any] = [
      kCVPixelBufferPixelFormatTypeKey as String: Int(kCVPixelFormatType_32BGRA),
    ]
    let output = AVPlayerItemVideoOutput(pixelBufferAttributes: attrs)
    output.suppressesPlayerRendering = true
    item.add(output)

    let player = AVPlayer(playerItem: item)
    player.actionAtItemEnd = .none
    self.player = player
    self.output = output

    if loop {
      NotificationCenter.default.addObserver(
        self,
        selector: #selector(handleDidPlayToEnd),
        name: .AVPlayerItemDidPlayToEndTime,
        object: item
      )
    }

    player.play()
    startTimer()
  }

  func stop() {
    timer?.cancel()
    timer = nil
    player?.pause()
    player = nil
    output = nil
    NotificationCenter.default.removeObserver(self)
  }

  private func startTimer() {
    let timer = DispatchSource.makeTimerSource(queue: queue)
    let interval = DispatchTimeInterval.milliseconds(1000 / max(fps, 1))
    timer.schedule(deadline: .now(), repeating: interval)
    timer.setEventHandler { [weak self] in
      self?.captureFrame()
    }
    self.timer = timer
    timer.resume()
  }

  @objc private func handleDidPlayToEnd() {
    guard loop, let player = player else { return }
    player.seek(to: .zero)
    player.play()
  }

  private func captureFrame() {
    guard let output = output else { return }
    let now = CACurrentMediaTime()
    if now - lastTick < 1.0 / Double(max(fps, 1)) {
      return
    }
    lastTick = now

    let itemTime = output.itemTime(forHostTime: now)
    guard output.hasNewPixelBuffer(forItemTime: itemTime),
          let pixelBuffer = output.copyPixelBuffer(forItemTime: itemTime, itemTimeForDisplay: nil) else {
      return
    }

    let timestampNs = Int64(now * 1_000_000_000)
    let rtcBuffer = RTCCVPixelBuffer(pixelBuffer: pixelBuffer)
    let frame = RTCVideoFrame(buffer: rtcBuffer, rotation: ._0, timeStampNs: timestampNs)
    delegate?.capturer(self, didCapture: frame)
    onFrame?(pixelBuffer, timestampNs)
  }
}
