import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Bell, Eye, ExternalLink, Camera } from 'lucide-react';
import DraggableModalWrapper from '../ui/DraggableModalWrapper';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userFirstName: string;
  userLastName: string;
  userPhone: string;
  userEmail: string;
  userProfilePic?: string;
  currentUserId: number; // ADD THIS
  onSaveProfile: (data: { firstName: string; lastName: string; phone: string }) => void;
  onProfilePictureUpdate?: () => void;
  // Notification preferences
  notificationPreferences: {
    popupNotifications: boolean;
    notificationSound: boolean;
    selectedSound: string;
  };
  onSaveNotificationPreferences: (prefs: {
    popupNotifications: boolean;
    notificationSound: boolean;
    selectedSound: string;
  }) => void;
}

type TabType = 'profile' | 'notifications' | 'themes';

const PreferencesModal: React.FC<PreferencesModalProps> = ({
  isOpen,
  onClose,
  userFirstName,
  userLastName,
  userPhone,
  userEmail,
  userProfilePic,
  currentUserId, // ADD THIS
  onSaveProfile,
  onProfilePictureUpdate, // ADD THIS
  notificationPreferences,
  onSaveNotificationPreferences,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [firstName, setFirstName] = useState(userFirstName);
  const [lastName, setLastName] = useState(userLastName);
  const [phone, setPhone] = useState(userPhone);
  const [language, setLanguage] = useState('English-US');
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false); // ADD THIS
  
  // Notifications state
  const [popupNotifications, setPopupNotifications] = useState(notificationPreferences.popupNotifications);
  const [notificationSound, setNotificationSound] = useState(notificationPreferences.notificationSound);
  const [selectedSound, setSelectedSound] = useState(notificationPreferences.selectedSound);
  const [conferenceRinger, setConferenceRinger] = useState(true);
  const [onlineNotification, setOnlineNotification] = useState(true);
  
  // Themes state
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark'>('light');

  // Update local state when props change
  useEffect(() => {
    setPopupNotifications(notificationPreferences.popupNotifications);
    setNotificationSound(notificationPreferences.notificationSound);
    setSelectedSound(notificationPreferences.selectedSound);
  }, [notificationPreferences]);

  useEffect(() => {
    setFirstName(userFirstName);
    setLastName(userLastName);
    setPhone(userPhone);
  }, [userFirstName, userLastName, userPhone]);

  if (!isOpen) return null;

  const handleSaveProfile = () => {
    onSaveProfile({ firstName, lastName, phone });
    setIsEditingProfile(false);
  };

  const handleCancelEdit = () => {
    setFirstName(userFirstName);
    setLastName(userLastName);
    setPhone(userPhone);
    setIsEditingProfile(false);
  };

  const handleNotificationChange = (field: string, value: any) => {
    let updatedPrefs = { popupNotifications, notificationSound, selectedSound };

    switch (field) {
      case 'popupNotifications':
        setPopupNotifications(value);
        updatedPrefs.popupNotifications = value;
        break;
      case 'notificationSound':
        setNotificationSound(value);
        updatedPrefs.notificationSound = value;
        break;
      case 'selectedSound':
        setSelectedSound(value);
        updatedPrefs.selectedSound = value;
        break;
    }

    onSaveNotificationPreferences(updatedPrefs);
  };

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (PNG, JPG, or GIF)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploadingProfilePic(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Image = reader.result as string;
          
          // Call API to update profile picture
          const { staffApi } = await import('../../api/staff');
          const response = await staffApi.updateProfilePicture(
            currentUserId,
            base64Image
          );

          if (response.success && response.data.profilePicUrl) {
            if (onProfilePictureUpdate) {
              onProfilePictureUpdate(); 
            }
          }
        } catch (error) {
          console.error('Error updating profile picture:', error);
          alert('Failed to update profile picture. Please try again.');
        } finally {
          setUploadingProfilePic(false);
        }
      };
      reader.onerror = () => {
        alert('Failed to read file. Please try again.');
        setUploadingProfilePic(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error updating profile picture:', error);
      alert('Failed to update profile picture. Please try again.');
      setUploadingProfilePic(false);
    }
  };

  const sounds = ['Ta-da-dum', 'Ta-ding', 'Whoo', 'Chime', 'Boop', 'Hey there'];

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
      <DraggableModalWrapper isOpen={isOpen} handleSelector=".preferences-drag-handle" className="w-[90vw] max-w-4xl">
        <div className="bg-white rounded-lg shadow-xl h-[600px] overflow-hidden flex flex-col">
          {/* Header - Draggable */}
          <div className="preferences-drag-handle flex items-center justify-between p-4 border-b cursor-grab active:cursor-grabbing select-none flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-900 pointer-events-none">
              Preferences
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 pointer-events-auto"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 border-r bg-gray-50 p-4">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex cursor-pointer items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-2 ${
                  activeTab === 'profile'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <User className="w-4 h-4" />
                Profile
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex cursor-pointer items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-2 ${
                  activeTab === 'notifications'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Bell className="w-4 h-4" />
                Notifications
              </button>
              <button
                onClick={() => setActiveTab('themes')}
                className={`w-full flex cursor-pointer items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'themes'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Eye className="w-4 h-4" />
                Themes
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 group [&::-webkit-scrollbar]:w-0 hover:[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-400 transition-all">
              {activeTab === 'profile' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal details</h3>               
                  {/* Profile Section - UPDATED THIS SECTION */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-4 mb-4">
                      {/* UPDATED PROFILE PICTURE SECTION */}
                      <div className="relative">
                        <input
                          type="file"
                          id="profile-picture-upload"
                          accept="image/png,image/jpeg,image/jpg,image/gif"
                          onChange={handleProfilePictureChange}
                          className="hidden"
                          disabled={uploadingProfilePic}
                        />
                        <label
                          htmlFor="profile-picture-upload"
                          className="relative group cursor-pointer block"
                        >
                          {userProfilePic ? (
                            <img
                              src={userProfilePic}
                              alt={`${firstName} ${lastName}`}
                              className="w-16 h-16 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-orange-400 flex items-center justify-center text-white text-xl font-semibold">
                              {firstName[0]}{lastName[0]}
                            </div>
                          )}
                          <div className="absolute bottom-0 right-0 bg-gray-800 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="w-3 h-3 text-white" />
                          </div>
                          {uploadingProfilePic && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                        </label>
                      </div>
                      {/* END UPDATED SECTION */}

                      {!isEditingProfile && (
                        <div className="flex-1">
                          <p className="text-base font-semibold text-gray-900">{firstName} {lastName}</p>
                          <p className="text-sm text-gray-600">{phone}</p>
                          {uploadingProfilePic && (
                            <p className="text-xs text-gray-600 mt-1">Uploading...</p>
                          )}
                        </div>
                      )}
                      {!isEditingProfile && (
                        <button
                          onClick={() => setIsEditingProfile(true)}
                          className="text-gray-600 hover:text-gray-900 cursor-pointer"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {isEditingProfile && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="First name"
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                          />
                          <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Last name"
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                          />
                        </div>
                        <div className="flex">
                            {/* Country Code Select */}
                            <div className="relative">
                              <select
                                className=" h-full rounded-l-md border border-gray-300 bg-white px-3 py-2 text-sm cursor-pointer appearance-none pr-8 focus:z-10 focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                                style={{ WebkitAppearance: "none", MozAppearance: "none" }}
                              >
                                <option>+63</option>
                              </select>
                            </div>

                            {/* Phone Input */}
                            <input
                              type="text"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="Phone number"
                              className="
                                flex-1 
                                px-3 py-2 
                                border border-l-0 border-gray-300 
                                rounded-r-md 
                                text-sm 
                                focus:ring-2 focus:ring-gray-500 focus:border-gray-500
                              "
                            />
                          </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveProfile}
                            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Email Section */}
                  <div className="mb-6">
                    <p className="text-sm font-semibold text-gray-900 mb-1">{userEmail}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">Change account password or manage your teams</p>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-green-600 border border-green-600 rounded-md hover:bg-green-50 transition-colors">
                        Manage account
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Display Language */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Display language</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white"
                    >
                      <option>English-US</option>
                      <option>English-UK</option>
                      <option>Spanish</option>
                      <option>French</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div>
                  {/* New incoming messages */}
                  <div className="mb-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">New incoming messages</h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={popupNotifications}
                          onChange={(e) => handleNotificationChange('popupNotifications', e.target.checked)}
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-700">Popup notifications</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={notificationSound}
                          onChange={(e) => handleNotificationChange('notificationSound', e.target.checked)}
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-700">Notification sound</span>
                      </label>
                      
                      {/* Sound Options */}
                      <div className="ml-6 mt-3 p-4 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-2 gap-2">
                          {sounds.map((sound) => (
                            <label
                              key={sound}
                              className={`flex items-center gap-2 ${
                                !notificationSound ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                              }`}
                            >
                              <input
                                type="radio"
                                name="sound"
                                value={sound}
                                checked={selectedSound === sound}
                                onChange={(e) => handleNotificationChange('selectedSound', e.target.value)}
                                disabled={!notificationSound}
                                className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500 disabled:opacity-50"
                              />
                              <span className="text-sm text-gray-700">{sound}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Other notifications */}
                  <div className="mb-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Other notifications</h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={conferenceRinger}
                          onChange={(e) => setConferenceRinger(e.target.checked)}
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-700">Audio/Video conference ringer</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={onlineNotification}
                          onChange={(e) => setOnlineNotification(e.target.checked)}
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-700">Co-worker is online notification</span>
                      </label>
                    </div>
                  </div>

                  {/* Email preferences */}
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Email preferences</h3>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-green-600 border border-green-600 rounded-md hover:bg-green-50 transition-colors">
                      Manage email preferences
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'themes' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Change the appearance of Messaging on desktop</h3>
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-green-500 transition-colors">
                      <input
                        type="radio"
                        name="theme"
                        value="light"
                        checked={selectedTheme === 'light'}
                        onChange={(e) => setSelectedTheme(e.target.value as 'light' | 'dark')}
                        className="mt-1 w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Light Theme</p>
                        <p className="text-xs text-gray-500 mt-0.5">The classic white & gray theme</p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-green-500 transition-colors">
                      <input
                        type="radio"
                        name="theme"
                        value="dark"
                        checked={selectedTheme === 'dark'}
                        onChange={(e) => setSelectedTheme(e.target.value as 'light' | 'dark')}
                        className="mt-1 w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Dark Theme</p>
                        <p className="text-xs text-gray-500 mt-0.5">A sleek night theme for improved focus</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DraggableModalWrapper>
    </div>,
    document.body
  );
};

export default PreferencesModal;