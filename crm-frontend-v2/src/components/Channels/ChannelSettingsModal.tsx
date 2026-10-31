import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, UserPlus, LogOut, Crown, Trash2, Users as UsersIcon, AlertTriangle } from "lucide-react";
import { Channel, ChannelMember } from "../../types/channels";
import DraggableModalWrapper from "../ui/DraggableModalWrapper";
import { getAvatarColor } from "../../utils/avatarColors";

interface ChannelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: Channel | null;
  members: ChannelMember[];
  currentUserId: number;
  onAddMembers: (memberIds: number[]) => Promise<void>;
  onRemoveMember: (memberId: number) => Promise<void>;
  onPromoteToAdmin: (memberId: number) => Promise<void>;
  onDemoteFromAdmin: (memberId: number) => Promise<void>;
  onLeaveChannel: () => Promise<void>;
  onDeleteChannel: () => Promise<void>;
  staffMembers: Array<{
    Uid: number;
    firstName: string;
    lastName: string;
    email: string;
  }>;
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmColor?: 'red' | 'amber' | 'blue' | 'gray';
  isLoading?: boolean;
}

function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  confirmColor = "red",
  isLoading = false
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const colorClasses = {
    red: 'bg-red-600 hover:bg-red-700',
    amber: 'bg-amber-600 hover:bg-amber-700',
    blue: 'bg-blue-600 hover:bg-blue-700',
    gray: 'bg-gray-600 hover:bg-gray-700'
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40">
      <DraggableModalWrapper isOpen={isOpen} handleSelector=".confirm-drag-handle" className="w-[90vw] max-w-md">
        <div className="bg-white  rounded-lg shadow-xl overflow-hidden flex flex-col">
          {/* Header - Draggable */}
          <div className="confirm-drag-handle flex items-center gap-3 p-4 border-b  cursor-grab active:cursor-grabbing select-none">
            <div className="w-10 h-10 rounded-lg bg-red-100  flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600 " />
            </div>
            <h3 className="text-base font-semibold text-gray-900  pointer-events-none flex-1">
              {title}
            </h3>
          </div>

          {/* Content */}
          <div className="p-4">
            <p className="text-sm text-gray-600 ">
              {message}
            </p>
          </div>

          {/* Footer */}
          <div className="flex gap-2 p-4 border-t  bg-gray-50 ">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700  bg-white  border border-gray-300  rounded-lg hover:bg-gray-50  disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${colorClasses[confirmColor]}`}
            >
              {isLoading ? 'Processing...' : confirmText}
            </button>
          </div>
        </div>
      </DraggableModalWrapper>
    </div>,
    document.body
  );
}

export default function ChannelSettingsModal({
  isOpen,
  onClose,
  channel,
  members,
  currentUserId,
  onAddMembers,
  onRemoveMember,
  onPromoteToAdmin,
  onDemoteFromAdmin,
  onLeaveChannel,
  onDeleteChannel,
  staffMembers
}: ChannelSettingsModalProps) {
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    confirmColor: 'red' | 'amber' | 'blue' | 'gray';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    confirmColor: 'red',
    onConfirm: () => {}
  });

  useEffect(() => {
    if (!isOpen) {
      setShowAddMembers(false);
      setSearchQuery("");
      setSelectedMembers([]);
    }
  }, [isOpen]);

  if (!isOpen || !channel) return null;

  const currentMember = members.find(m => m.userId === currentUserId);
  const isAdmin = currentMember?.isAdmin || false;
  const isCreator = channel?.created_by === currentUserId;

  // Filter out staff who are already members
  const memberIds = members.map(m => m.userId);
  const availableStaff = staffMembers.filter(s => !memberIds.includes(s.Uid));

  const filteredStaff = availableStaff.filter(staff =>
    `${staff.firstName} ${staff.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleMemberSelection = (userId: number) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAddMembers = async () => {
    if (selectedMembers.length === 0) return;

    setIsLoading(true);
    try {
      await onAddMembers(selectedMembers);
      setSelectedMembers([]);
      setSearchQuery("");
      setShowAddMembers(false);
    } catch (error) {
      console.error("Error adding members:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChannel = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Channel',
      message: 'Are you sure you want to delete this channel? This action cannot be undone and will delete all messages.',
      confirmText: 'Delete Channel',
      confirmColor: 'red',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          await onDeleteChannel();
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          onClose();
        } catch (error) {
          console.error("Error deleting channel:", error);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const handleRemoveMember = (memberId: number, memberName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove Member',
      message: `Are you sure you want to remove ${memberName} from this channel?`,
      confirmText: 'Remove',
      confirmColor: 'red',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          await onRemoveMember(memberId);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error("Error removing member:", error);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const handlePromoteToAdmin = (memberId: number, memberName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Promote to Admin',
      message: `Promote ${memberName} to channel admin? They will be able to manage members and channel settings.`,
      confirmText: 'Promote',
      confirmColor: 'amber',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          await onPromoteToAdmin(memberId);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error("Error promoting member:", error);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const handleDemoteFromAdmin = (memberId: number, memberName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Demote from Admin',
      message: `Demote ${memberName} back to regular member? They will lose admin privileges.`,
      confirmText: 'Demote',
      confirmColor: 'gray',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          await onDemoteFromAdmin(memberId);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error("Error demoting member:", error);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const handleLeaveChannel = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Leave Channel',
      message: 'Are you sure you want to leave this channel? You will need to be re-invited to join again.',
      confirmText: 'Leave Channel',
      confirmColor: 'red',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          await onLeaveChannel();
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          onClose();
        } catch (error) {
          console.error("Error leaving channel:", error);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  return (
    <>
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        confirmColor={confirmModal.confirmColor}
        isLoading={isLoading}
      />

      {createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
          <DraggableModalWrapper isOpen={isOpen} handleSelector=".modal-drag-handle" className="w-[90vw] max-w-2xl">
            <div className="bg-white  rounded-lg shadow-xl max-h-[85vh] overflow-hidden flex flex-col">
              {/* Header - Draggable */}
              <div className="modal-drag-handle flex items-center justify-between p-4 border-b  cursor-grab active:cursor-grabbing select-none flex-shrink-0">
                <h2 className="text-lg font-semibold text-gray-900  pointer-events-none">
                  Channel Settings
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600  pointer-events-auto"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* Channel Info */}
                <div className="mb-6">
                  <h3 className="text-base font-semibold text-gray-900  mb-1">
                    {channel.name}
                  </h3>
                  {channel.description && (
                    <p className="text-gray-600  text-sm mb-2">
                      {channel.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-500  flex items-center gap-1">
                      <UsersIcon className="w-3.5 h-3.5" />
                      {members.length} member{members.length !== 1 ? 's' : ''}
                    </span>
                    {channel.channel_access_type && (
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        channel.channel_access_type === 'read-only'
                          ? 'bg-amber-100  text-amber-700 '
                          : 'bg-blue-100  text-blue-700 '
                      }`}>
                        {channel.channel_access_type === 'read-only' ? 'Read-Only' : 'Read/Write'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Members Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-900  flex items-center gap-2">
                      <UsersIcon className="w-4 h-4" />
                      Members
                    </h4>
                    {isAdmin && (
                      <button
                        onClick={() => setShowAddMembers(!showAddMembers)}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5 text-xs font-medium transition-colors"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Add Members
                      </button>
                    )}
                  </div>

                  {/* Add Members Section */}
                  {showAddMembers && isAdmin && (
                    <div className="mb-4 p-3 bg-gray-50  rounded-lg">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search staff to add..."
                        className="w-full px-3 py-2 text-sm border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent   mb-2"
                      />

                      {searchQuery && (
                        <div className="max-h-48 overflow-y-auto border border-gray-200  rounded-lg mb-2">
                          {filteredStaff.map((staff) => (
                            <label
                              key={staff.Uid}
                              className="flex items-center gap-2 p-2 hover:bg-gray-100  cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedMembers.includes(staff.Uid)}
                                onChange={() => toggleMemberSelection(staff.Uid)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900  truncate">
                                  {staff.firstName} {staff.lastName}
                                </p>
                                <p className="text-xs text-gray-500  truncate">
                                  {staff.email}
                                </p>
                              </div>
                            </label>
                          ))}
                          {filteredStaff.length === 0 && (
                            <p className="p-3 text-center text-xs text-gray-500">No staff found</p>
                          )}
                        </div>
                      )}

                      {selectedMembers.length > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600 ">
                            {selectedMembers.length} selected
                          </span>
                          <button
                            onClick={handleAddMembers}
                            disabled={isLoading}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-xs font-medium transition-colors"
                          >
                            {isLoading ? "Adding..." : "Add to Channel"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Members List */}
                  <div className="space-y-2">
                    {members.map((member) => {
                      // console.log('Member data:', member);
                      const avatarColor = getAvatarColor(member.userId);
                      
                      return (
                        <div
                          key={member.userId}
                          className="flex items-center justify-between p-2.5 border border-gray-200  rounded-lg hover:bg-gray-50  transition-colors"
                        >
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            {member.profilePicUrl ? (
                              <img
                                src={member.profilePicUrl}
                                alt={`${member.firstName} ${member.lastName}`}
                                className="w-9 h-9 rounded-md object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className={`w-9 h-9 rounded-md ${avatarColor} flex items-center justify-center text-white font-semibold text-xs flex-shrink-0`}>
                                {member.firstName[0]}{member.lastName[0]}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900  flex items-center gap-1.5 flex-wrap">
                                <span className="truncate">
                                  {member.firstName} {member.lastName}
                                </span>
                                {channel.created_by === member.userId && (
                                  <span className="px-1.5 py-0.5 bg-purple-100  text-purple-700  text-xs rounded flex items-center gap-0.5 flex-shrink-0">
                                    <Crown className="w-2.5 h-2.5" />
                                    Creator
                                  </span>
                                )}
                                {Boolean(member.isAdmin) && channel.created_by !== member.userId && (
                                  <span className="px-1.5 py-0.5 bg-amber-100  text-amber-700  text-xs rounded flex items-center gap-0.5 flex-shrink-0">
                                    <Crown className="w-2.5 h-2.5" />
                                    Admin
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500  capitalize truncate">
                                {member.role}
                              </p>
                            </div>
                          </div>

                          {/* Member Actions */}
                          {isAdmin && member.userId !== currentUserId && channel.created_by !== member.userId && (
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {!member.isAdmin ? (
                                <button
                                  onClick={() => handlePromoteToAdmin(member.userId, `${member.firstName} ${member.lastName}`)}
                                  disabled={isLoading}
                                  className="px-2.5 py-1 text-xs border border-amber-500 text-amber-600  rounded hover:bg-amber-50  disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                                >
                                  <Crown className="w-3 h-3" />
                                  Promote
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleDemoteFromAdmin(member.userId, `${member.firstName} ${member.lastName}`)}
                                  disabled={isLoading}
                                  className="px-2.5 py-1 text-xs border border-gray-500 text-gray-600  rounded hover:bg-gray-50  disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                                >
                                  <Crown className="w-3 h-3" />
                                  Demote
                                </button>
                              )}
                              <button
                                onClick={() => handleRemoveMember(member.userId, `${member.firstName} ${member.lastName}`)}
                                disabled={isLoading}
                                className="px-2.5 py-1 text-xs border border-red-500 text-red-600  rounded hover:bg-red-50  disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t  p-4 space-y-2 flex-shrink-0">
                {(isCreator || isAdmin) && (
                  <button
                    onClick={handleDeleteChannel}
                    disabled={isLoading}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Channel
                  </button>
                )}
                <button
                  onClick={handleLeaveChannel}
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50  disabled:border-gray-400 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Leave Channel
                </button>
              </div>
            </div>
          </DraggableModalWrapper>
        </div>,
        document.body
      )}
    </>
  );
}