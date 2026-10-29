import { useEffect, useRef, useState } from 'react';
import { Phone, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { CallType, CallUser } from '../../types/calls';

interface ActiveCallScreenProps {
  callType: CallType;
  remoteUser: CallUser;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  callStartTime: number | null;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
}

export const ActiveCallScreen = ({
  callType,
  remoteUser,
  localStream,
  remoteStream,
  isMuted,
  isVideoOff,
  callStartTime,
  onEndCall,
  onToggleMute,
  onToggleVideo,
}: ActiveCallScreenProps) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const [callDuration, setCallDuration] = useState('00:00');

  // Set up video streams
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
    }
    // Also set audio for voice calls
    if (remoteAudioRef.current && remoteStream) {
        remoteAudioRef.current.srcObject = remoteStream;
    }
    }, [remoteStream]);

  // Call duration timer
  useEffect(() => {
    if (!callStartTime) return;

    const interval = setInterval(() => {
      const duration = Math.floor((Date.now() - callStartTime) / 1000);
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      setCallDuration(
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [callStartTime]);

  const isVideoCall = callType === 'video';

  return (
    <div className="fixed inset-0 z-50 bg-gray-900">
      {/* Remote Video/Audio */}
      <div className="relative w-full h-full">
        {isVideoCall ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800">
            {remoteUser.profilePicUrl ? (
              <img
                src={remoteUser.profilePicUrl}
                alt={`${remoteUser.firstName} ${remoteUser.lastName}`}
                className="w-40 h-40 rounded-full object-cover border-4 border-white shadow-2xl mb-6"
              />
            ) : (
              <div className="w-40 h-40 rounded-full bg-white/20 flex items-center justify-center text-white text-6xl font-bold border-4 border-white shadow-2xl mb-6">
                {remoteUser.firstName[0]}{remoteUser.lastName[0]}
              </div>
            )}
            <h2 className="text-white text-3xl font-bold mb-2">
              {remoteUser.firstName} {remoteUser.lastName}
            </h2>
            <p className="text-white/80 text-lg">{callDuration}</p>
          </div>
        )}

        {/* Local Video (Picture-in-Picture for video calls) */}
        {isVideoCall && (
          <div className="absolute top-4 right-4 w-40 h-30 bg-gray-800 rounded-lg overflow-hidden shadow-2xl border-2 border-white/20">
            {isVideoOff ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-700">
                <VideoOff className="w-8 h-8 text-white/60" />
              </div>
            ) : (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
              />
            )}
          </div>
        )}

        {/* Call Info Overlay (for video calls) */}
        {isVideoCall && (
          <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg">
            <p className="text-white font-medium">
              {remoteUser.firstName} {remoteUser.lastName}
            </p>
            <p className="text-white/80 text-sm">{callDuration}</p>
          </div>
        )}

        {/* Control Buttons */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
          {/* Mute/Unmute */}
          <button
            onClick={onToggleMute}
            className={`w-14 h-14 rounded-full ${
              isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
            } text-white flex items-center justify-center transition-all shadow-lg`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {/* End Call */}
          <button
            onClick={onEndCall}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-lg hover:shadow-xl"
          >
            <Phone className="w-7 h-7 rotate-135" />
          </button>

          {/* Video On/Off (only for video calls) */}
          {isVideoCall && (
            <button
              onClick={onToggleVideo}
              className={`w-14 h-14 rounded-full ${
                isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
              } text-white flex items-center justify-center transition-all shadow-lg`}
            >
              {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </button>
          )}
        </div>
      </div>

      {/* Hidden audio element for voice calls */}
      <audio ref={remoteAudioRef} autoPlay />
      
      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
};