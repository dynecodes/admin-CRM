import { useEffect, useState } from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { IncomingCall } from '../../types/calls';

interface IncomingCallModalProps {
  incomingCall: IncomingCall | null;
  onAccept: () => void;
  onReject: () => void;
}

export const IncomingCallModal = ({ incomingCall, onAccept, onReject }: IncomingCallModalProps) => {
  const [ringtone] = useState(() => {
    try {
      const audio = new Audio('/sounds/ringtone.mp3');
      audio.loop = true;
      return audio;
    } catch (err) {
      console.warn('Ringtone file not available');
      return null;
    }
  });

  useEffect(() => {
    if (incomingCall && ringtone) {
      ringtone.play().catch(_err => {
        console.debug('Ringtone not available');
      });
    } else if (ringtone) {
      ringtone.pause();
      ringtone.currentTime = 0;
    }

    return () => {
      if (ringtone) {
        ringtone.pause();
        ringtone.currentTime = 0;
      }
    };
  }, [incomingCall, ringtone]);

  if (!incomingCall) return null;

  const isVideoCall = incomingCall.type === 'video';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
        {/* Profile Picture */}
        <div className="mb-6">
          {incomingCall.caller.profilePicUrl ? (
            <img
              src={incomingCall.caller.profilePicUrl}
              alt={`${incomingCall.caller.firstName} ${incomingCall.caller.lastName}`}
              className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-blue-500"
            />
          ) : (
            <div className="w-24 h-24 rounded-full mx-auto bg-blue-500 flex items-center justify-center text-white text-3xl font-bold border-4 border-blue-600">
              {incomingCall.caller.firstName[0]}{incomingCall.caller.lastName[0]}
            </div>
          )}
        </div>

        {/* Caller Name */}
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {incomingCall.caller.firstName} {incomingCall.caller.lastName}
        </h2>

        {/* Call Type */}
        <p className="text-gray-600 mb-8 flex items-center justify-center gap-2">
          {isVideoCall ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
          Incoming {isVideoCall ? 'video' : 'voice'} call...
        </p>

        {/* Action Buttons */}
        <div className="flex justify-center gap-6">
          {/* Reject Button */}
          <button
            onClick={onReject}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-lg hover:shadow-xl"
          >
            <PhoneOff className="w-7 h-7" />
          </button>

          {/* Accept Button */}
          <button
            onClick={onAccept}
            className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-all shadow-lg hover:shadow-xl"
          >
            {isVideoCall ? <Video className="w-7 h-7" /> : <Phone className="w-7 h-7" />}
          </button>
        </div>
      </div>
    </div>
  );
};