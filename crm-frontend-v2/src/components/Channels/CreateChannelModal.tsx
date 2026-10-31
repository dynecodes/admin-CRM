import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Briefcase, Users, Lightbulb, MessageSquare } from "lucide-react";
import { ChannelType, ChannelAccessType, CreateChannelData } from "../../types/channels";
import DraggableModalWrapper from "../ui/DraggableModalWrapper";
import { Button } from "flowbite-react";

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChannel: (data: CreateChannelData) => Promise<void>;
  staffMembers: Array<{
    Uid: number;
    firstName: string;
    lastName: string;
    email: string;
  }>;
}

type ChannelTypeOption = {
  type: ChannelType;
  icon: typeof Briefcase;
  title: string;
  description: string;
  bgColor: string;
};

const channelTypeOptions: ChannelTypeOption[] = [
  {
    type: 'project',
    icon: Briefcase,
    title: 'A Project you are working on',
    description: 'Share project files, manage tasks and get updates. E.g. Website Design, Product Launch',
    bgColor: 'bg-teal-100'
  },
  {
    type: 'department',
    icon: Users,
    title: 'Your Department or Function',
    description: 'Share knowledge and connect with your team. E.g. Sales, HR, IT',
    bgColor: 'bg-green-100'
  },
  {
    type: 'interest',
    icon: Lightbulb,
    title: 'A Shared Interest',
    description: 'Connect with like-minded people around a topic. E.g. Startups, Design',
    bgColor: 'bg-purple-100'
  },
  {
    type: 'other',
    icon: MessageSquare,
    title: 'Any other topic',
    description: 'Could be anything you want to discuss with the team.',
    bgColor: 'bg-orange-100'
  }
];

export default function CreateChannelModal({
  isOpen,
  onClose,
  onCreateChannel,
  staffMembers
}: CreateChannelModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState<ChannelType | null>(null);
  const [channelName, setChannelName] = useState("");
  const [channelAccessType, setChannelAccessType] = useState<ChannelAccessType>('read-write');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleTypeSelect = (type: ChannelType) => {
    setSelectedType(type);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleClose = () => {
    // Reset all state
    setStep(1);
    setSelectedType(null);
    setChannelName("");
    setChannelAccessType('read-write');
    setSearchQuery("");
    setSelectedMembers([]);
    setIsCreating(false);
    onClose();
  };

  const toggleMember = (userId: number) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const filteredStaff = staffMembers.filter(staff =>
    `${staff.firstName} ${staff.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async () => {
    if (!selectedType || !channelName.trim()) {
      return;
    }

    setIsCreating(true);
    try {
      await onCreateChannel({
        name: channelName.trim(),
        channel_type: selectedType,
        channel_access_type: channelAccessType,
        memberIds: selectedMembers
      });
      handleClose();
    } catch (error) {
      console.error("Error creating channel:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
      <DraggableModalWrapper isOpen={isOpen} handleSelector=".modal-drag-handle" className="w-[90vw] max-w-xl">
        <div className="bg-white  rounded-lg shadow-xl max-h-[85vh] overflow-hidden flex flex-col">
          {/* Header - Draggable */}
          <div className="modal-drag-handle flex items-center justify-between p-4 border-b border-gray-200 cursor-grab active:cursor-grabbing select-none flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-900  pointer-events-none">
              Start a New Channel
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 "
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="p-4 overflow-y-auto flex-1 group [&::-webkit-scrollbar]:w-0 hover:[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-400 transition-all">
            {step === 1 ? (
              // Step 1: Select Channel Type
              <div>
                <p className="text-gray-600  mb-4 text-sm">
                  Channels are where you can collaborate with different members of your team. All channels are private and invitation-only.
                </p>

                <h3 className="text-base font-medium text-gray-900  mb-3">
                  What is your channel about?
                </h3>

                <div className="space-y-2">
                  {channelTypeOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.type}
                        onClick={() => handleTypeSelect(option.type)}
                        className="w-full cursor-pointer flex items-start gap-3 p-3 border border-gray-200  rounded-lg hover:border-teal-500 hover:bg-teal-50  transition-all text-left"
                      >
                        <div className={`${option.bgColor} p-2 rounded-lg flex-shrink-0`}>
                          <Icon className="w-5 h-5 text-gray-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900  text-sm mb-0.5">
                            {option.title}
                          </h4>
                          <p className="text-xs text-gray-600  leading-snug">
                            {option.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              // Step 2: Configure Channel
              <div>
                <p className="text-gray-600  mb-4 text-sm">
                  Configure your channel settings and invite team members. You can choose between a read-only announcement channel or a collaborative discussion channel.
                </p>

                {/* Channel Access Type Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Channel Type
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setChannelAccessType('read-write')}
                      className={`flex-1 px-3 py-2 cursor-pointer rounded-lg border-2 font-medium transition-all text-sm ${
                        channelAccessType === 'read-write'
                          ? 'border-teal-500 bg-teal-50  text-teal-700 '
                          : 'border-gray-200  text-gray-700  hover:border-gray-300'
                      }`}
                    >
                      Read/Write
                    </button>
                    <button
                      onClick={() => setChannelAccessType('read-only')}
                      className={`flex-1 px-3 py-2 cursor-pointer rounded-lg border-2 font-medium transition-all text-sm ${
                        channelAccessType === 'read-only'
                          ? 'border-teal-500 bg-teal-50  text-teal-700 '
                          : 'border-gray-200  text-gray-700  hover:border-gray-300'
                      }`}
                    >
                      Read-Only
                    </button>
                  </div>
                  <p className="text-xs text-gray-500  mt-1.5">
                    {channelAccessType === 'read-only' 
                      ? 'Only admins can send messages (announcement channel)' 
                      : 'All members can send messages'}
                  </p>
                </div>

                {/* Channel Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Name your channel
                  </label>
                  <input
                    type="text"
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    placeholder="e.g. Website Redesign, New Product Launch"
                    className="w-full px-3 py-2 text-sm border border-gray-300  rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent  "
                  />
                </div>

                {/* Add Colleagues */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Invite colleagues to your channel
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Type a name or email to invite colleagues"
                    className="w-full px-3 py-2 text-sm border border-gray-300  rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent   mb-2"
                  />
                  <div className="max-h-48 overflow-y-auto border border-gray-200  rounded-lg group [&::-webkit-scrollbar]:w-0 hover:[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-400 transition-all">
                    {filteredStaff.length > 0 ? (
                      filteredStaff.map((staff) => (
                        <label
                          key={staff.Uid}
                          className="flex items-center gap-3 p-2 hover:bg-gray-50  cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedMembers.includes(staff.Uid)}
                            onChange={() => toggleMember(staff.Uid)}
                            className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900  truncate">
                              {staff.firstName} {staff.lastName}
                            </div>
                            <div className="text-xs text-gray-500  truncate">
                              {staff.email}
                            </div>
                          </div>
                        </label>
                      ))
                    ) : (
                      <div className="p-4 text-center text-sm text-gray-500 ">
                        No staff members found
                      </div>
                    )}
                  </div>
                  {selectedMembers.length > 0 && (
                    <p className="text-xs text-gray-500  mt-1.5">
                      {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-4 border-t border-gray-200  flex-shrink-0">
            {step === 2 && (
              <Button
                onClick={handleBack}
                className="cursor-pointer" color="light"
              >
                Back
              </Button>
            )}
            <div className="flex-1" />
            <div className="flex gap-2">
              <Button
                onClick={handleClose}
                className="cursor-pointer" color="light"
              >
                Cancel
              </Button>
              {step === 2 && (
                <Button
                  onClick={handleCreate}
                  disabled={!channelName.trim() || isCreating}
                  className="px-4 py-2 text-sm cursor-pointer font-medium text-white bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  {isCreating ? 'Creating...' : 'Create Channel'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DraggableModalWrapper>
    </div>,
    document.body
  );
}