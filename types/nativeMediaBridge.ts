export type NativeWebRTCSessionDescription = {
  sdp: string;
  type: string | null;
};

export type NativeWebRTCMediaConstraints = {
  audio?: boolean | Record<string, unknown>;
  video?: boolean | Record<string, unknown>;
};

export type NativeGumOfferPayload = {
  requestId: string;
  offer: NativeWebRTCSessionDescription;
  constraints?: NativeWebRTCMediaConstraints;
  rtcConfig?: RTCConfiguration;
};

export type NativeGumAnswerPayload = {
  requestId: string;
  answer: NativeWebRTCSessionDescription;
};

export type NativeGumIcePayload = {
  requestId: string;
  candidate: RTCIceCandidateInit;
};

export type NativeGumErrorPayload = {
  requestId: string;
  message: string;
  code?: string;
};

export type NativeGumCancelPayload = {
  requestId: string;
};
