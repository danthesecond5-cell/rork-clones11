import Foundation
import ExpoModulesCore
import WebRTC

private final class SyntheticVideoCapturer: RTCVideoCapturer {
  private var timer: DispatchSourceTimer?
  private var frameCount: Int64 = 0
  private let width: Int
  private let height: Int
  private let fps: Int

  init(delegate: RTCVideoCapturerDelegate, width: Int, height: Int, fps: Int) {
    self.width = width
    self.height = height
    self.fps = fps
    super.init(delegate: delegate)
  }

  func start() {
    if timer != nil { return }
    let queue = DispatchQueue(label: "native.media.bridge.synthetic.capturer")
    let timer = DispatchSource.makeTimerSource(queue: queue)
    let interval = DispatchTimeInterval.milliseconds(max(1, 1000 / max(1, fps)))
    timer.schedule(deadline: .now(), repeating: interval, leeway: .milliseconds(2))
    timer.setEventHandler { [weak self] in
      self?.emitFrame()
    }
    self.timer = timer
    timer.resume()
  }

  func stop() {
    timer?.cancel()
    timer = nil
  }

  private func emitFrame() {
    guard let delegate = delegate else { return }

    let buffer = RTCI420Buffer(width: width, height: height)
    let yPlane = buffer.dataY
    let uPlane = buffer.dataU
    let vPlane = buffer.dataV
    let yStride = buffer.strideY
    let uStride = buffer.strideU
    let vStride = buffer.strideV

    // Simple animated green pattern
    let baseY: UInt8 = UInt8(110 + (frameCount % 40))
    let baseU: UInt8 = 54
    let baseV: UInt8 = 34

    for y in 0..<height {
      let row = yPlane.advanced(by: y * yStride)
      for x in 0..<width {
        row[x] = baseY
      }
    }

    let chromaHeight = height / 2
    let chromaWidth = width / 2
    for y in 0..<chromaHeight {
      let uRow = uPlane.advanced(by: y * uStride)
      let vRow = vPlane.advanced(by: y * vStride)
      for x in 0..<chromaWidth {
        uRow[x] = baseU
        vRow[x] = baseV
      }
    }

    frameCount += 1
    let timeNs = Int64(CACurrentMediaTime() * 1_000_000_000)
    let frame = RTCVideoFrame(buffer: buffer, rotation: ._0, timeStampNs: timeNs)
    delegate.capturer(self, didCapture: frame)
  }
}

private final class NativeBridgeSession: NSObject, RTCPeerConnectionDelegate {
  let requestId: String
  let peerConnection: RTCPeerConnection
  let capturer: SyntheticVideoCapturer
  let stream: RTCMediaStream
  let eventSink: (String, [String: Any]) -> Void

  init(
    requestId: String,
    peerConnection: RTCPeerConnection,
    capturer: SyntheticVideoCapturer,
    stream: RTCMediaStream,
    eventSink: @escaping (String, [String: Any]) -> Void
  ) {
    self.requestId = requestId
    self.peerConnection = peerConnection
    self.capturer = capturer
    self.stream = stream
    self.eventSink = eventSink
    super.init()
    self.peerConnection.delegate = self
  }

  func close() {
    capturer.stop()
    peerConnection.close()
  }

  func peerConnection(_ peerConnection: RTCPeerConnection, didGenerate candidate: RTCIceCandidate) {
    eventSink("nativeGumIce", [
      "requestId": requestId,
      "candidate": [
        "candidate": candidate.sdp,
        "sdpMLineIndex": candidate.sdpMLineIndex,
        "sdpMid": candidate.sdpMid ?? ""
      ]
    ])
  }

  func peerConnection(_ peerConnection: RTCPeerConnection, didChange stateChanged: RTCSignalingState) {}
  func peerConnection(_ peerConnection: RTCPeerConnection, didAdd stream: RTCMediaStream) {}
  func peerConnection(_ peerConnection: RTCPeerConnection, didRemove stream: RTCMediaStream) {}
  func peerConnectionShouldNegotiate(_ peerConnection: RTCPeerConnection) {}
  func peerConnection(_ peerConnection: RTCPeerConnection, didChange newState: RTCIceConnectionState) {}
  func peerConnection(_ peerConnection: RTCPeerConnection, didChange newState: RTCIceGatheringState) {}
  func peerConnection(_ peerConnection: RTCPeerConnection, didRemove candidates: [RTCIceCandidate]) {}
  func peerConnection(_ peerConnection: RTCPeerConnection, didOpen dataChannel: RTCDataChannel) {}
}

public final class NativeMediaBridgeModule: Module {
  private var factory: RTCPeerConnectionFactory?
  private var sessions: [String: NativeBridgeSession] = [:]

  public func definition() -> ModuleDefinition {
    Name("NativeMediaBridge")
    Events("nativeGumIce", "nativeGumError")

    AsyncFunction("createSession") { (requestId: String, offer: [String: Any], constraints: [String: Any]?, rtcConfig: [String: Any]?) -> [String: Any] in
      if self.factory == nil {
        RTCInitializeSSL()
        self.factory = RTCPeerConnectionFactory()
      }
      guard let factory = self.factory else {
        throw NSError(domain: "NativeMediaBridge", code: 1, userInfo: [NSLocalizedDescriptionKey: "WebRTC factory unavailable"])
      }

      let config = RTCConfiguration()
      config.iceServers = []

      let constraints = RTCMediaConstraints(mandatoryConstraints: nil, optionalConstraints: nil)
      guard let peerConnection = factory.peerConnection(with: config, constraints: constraints, delegate: nil) else {
        throw NSError(domain: "NativeMediaBridge", code: 2, userInfo: [NSLocalizedDescriptionKey: "Failed to create RTCPeerConnection"])
      }

      let videoSource = factory.videoSource()
      let width = 1080
      let height = 1920
      let fps = 30
      let capturer = SyntheticVideoCapturer(delegate: videoSource, width: width, height: height, fps: fps)
      let videoTrack = factory.videoTrack(with: videoSource, trackId: "native_video_\(requestId)")

      let stream = factory.mediaStream(withStreamId: "native_stream_\(requestId)")
      stream.addVideoTrack(videoTrack)
      _ = peerConnection.add(videoTrack, streamIds: [stream.streamId])

      let session = NativeBridgeSession(
        requestId: requestId,
        peerConnection: peerConnection,
        capturer: capturer,
        stream: stream,
        eventSink: { [weak self] eventName, payload in
          self?.sendEvent(eventName, payload)
        }
      )
      sessions[requestId] = session

      capturer.start()

      guard
        let sdp = offer["sdp"] as? String,
        let type = offer["type"] as? String
      else {
        sessions.removeValue(forKey: requestId)
        session.close()
        throw NSError(domain: "NativeMediaBridge", code: 3, userInfo: [NSLocalizedDescriptionKey: "Invalid offer payload"])
      }
      
      let sessionType: RTCSdpType
      switch type.lowercased() {
      case "offer":
        sessionType = .offer
      case "answer":
        sessionType = .answer
      case "pranswer":
        sessionType = .prAnswer
      case "rollback":
        sessionType = .rollback
      default:
        sessions.removeValue(forKey: requestId)
        session.close()
        throw NSError(domain: "NativeMediaBridge", code: 3, userInfo: [NSLocalizedDescriptionKey: "Unsupported SDP type"])
      }

      let remoteDesc = RTCSessionDescription(type: sessionType, sdp: sdp)
      return try await withCheckedThrowingContinuation { continuation in
        peerConnection.setRemoteDescription(remoteDesc) { error in
          if let error = error {
            session.close()
            self.sessions.removeValue(forKey: requestId)
            continuation.resume(throwing: error)
            return
          }

          peerConnection.answer(for: RTCMediaConstraints(mandatoryConstraints: nil, optionalConstraints: nil)) { answer, answerError in
            if let answerError = answerError {
              session.close()
              self.sessions.removeValue(forKey: requestId)
              continuation.resume(throwing: answerError)
              return
            }

            guard let answer = answer else {
              session.close()
              self.sessions.removeValue(forKey: requestId)
              continuation.resume(throwing: NSError(domain: "NativeMediaBridge", code: 4, userInfo: [NSLocalizedDescriptionKey: "No answer created"]))
              return
            }

            peerConnection.setLocalDescription(answer) { localError in
              if let localError = localError {
                session.close()
                self.sessions.removeValue(forKey: requestId)
                continuation.resume(throwing: localError)
                return
              }

              continuation.resume(returning: [
                "type": "answer",
                "sdp": answer.sdp
              ])
            }
          }
        }
      }
    }

    AsyncFunction("addIceCandidate") { (requestId: String, candidate: [String: Any]) -> Void in
      guard let session = self.sessions[requestId] else { return }
      guard let sdp = candidate["candidate"] as? String else { return }
      let sdpMid = candidate["sdpMid"] as? String
      let sdpMLineIndex = candidate["sdpMLineIndex"] as? Int32 ?? 0
      let iceCandidate = RTCIceCandidate(sdp: sdp, sdpMLineIndex: sdpMLineIndex, sdpMid: sdpMid)
      session.peerConnection.add(iceCandidate)
    }

    AsyncFunction("closeSession") { (requestId: String) -> Void in
      guard let session = self.sessions[requestId] else { return }
      session.close()
      self.sessions.removeValue(forKey: requestId)
    }
  }
}
