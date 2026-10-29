import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

interface NotificationBannerProps {
  type: 'dm' | 'channel'; 
  chatId: number; 
  chatName: string;
  message: string;
  senderName: string;
  senderProfilePic?: string;
  duration?: number;
  onClose: () => void;
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({
  type, 
  chatId,
  chatName,
  message,
  senderName,
  senderProfilePic,
  duration = 5000,
  onClose
}) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  if (!isVisible) return null;

  const handleClick = () => {
    handleClose();
    
    // Determine the correct path based on message type
    const role = window.location.pathname.split('/')[1]; // Get 'admin', 'staff', or 'technical'
    
    if (type === 'dm') {
        // Navigate to DM with the sender
        navigate(`/${role}/messaging?chat=${chatId}&type=dm`);
    } else {
        // Navigate to channel
        navigate(`/${role}/messaging?chat=${chatId}&type=channel`);
    }
    };

  // Truncate message if too long
  const displayMessage = message.length > 80 ? message.substring(0, 80) + '...' : message;

  return (
    <div
      className={`fixed top-4 right-4 z-[10000] w-96 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 ${
        isLeaving ? 'translate-x-[450px] opacity-0' : 'translate-x-0 opacity-100'
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 flex items-center justify-between">
        <span className="text-white text-sm font-semibold">New Message</span>
        <button
          onClick={handleClose}
          className="text-white hover:text-gray-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={handleClick}>
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {senderProfilePic ? (
              <img
                src={senderProfilePic}
                alt={senderName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white text-sm font-semibold">
                {senderName.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </div>
            )}
          </div>

          {/* Message Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-gray-900">{senderName}</span>
              <span className="text-xs text-gray-500">in</span>
              <span className="text-xs font-medium text-red-600 truncate">{chatName}</span>
            </div>
            <p className="text-sm text-gray-700 line-clamp-2">{displayMessage}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationBanner;