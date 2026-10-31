export type CallType = 'voice' | 'video';
export type CallStatus = 'idle' | 'calling' | 'ringing' | 'active' | 'ended' | 'declined' | 'missed';

export interface CallUser {
  userId: number;
  firstName: string;
  lastName: string;
  profilePicUrl?: string | null;
}

export interface Call {
  callId: string;
  type: CallType;
  caller: CallUser;
  recipient: CallUser;
  status: CallStatus;
  startedAt?: number;
  endedAt?: number;
}

export interface IncomingCall {
  callId: string;
  type: CallType;
  caller: CallUser;
  signal: any; // WebRTC signal data from simple-peer
}

export interface CallSignal {
  callId: string;
  signal: any; // WebRTC signal data
}

export interface IceCandidate {
  callId: string;
  candidate: RTCIceCandidate;
}