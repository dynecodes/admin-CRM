import { ArrowLeft, Search, Hash } from "lucide-react";
import { Channel } from "../../types/channels";
import { Conversation } from "../../types/messaging";
import { useState } from "react";

interface BrowseChatsPanel {
  conversations: (Conversation & { id?: number })[];
  channels: Channel[];
  allStaff: Array<{ id: number; firstName: string; lastName: string; email: string; profilePicUrl?: string | null }>;
  onSelectChat: (type: 'dm' | 'channel', id: number) => void;
  onBack: () => void;
}

export default function BrowseChatsPanel({
  conversations,
  channels,
  allStaff,
  onSelectChat,
  onBack,
}: BrowseChatsPanel) {
  const [searchQuery, setSearchQuery] = useState("");

  const conversationIds = new Set(conversations.map(c => c.other_user_id));
  const allPeople = allStaff.filter(staff => !conversationIds.has(staff.id));

  const filteredConversations = conversations.filter((conv) =>
    `${conv.firstName} ${conv.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (conv.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAllPeople = allPeople.filter((staff) =>
    `${staff.firstName} ${staff.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredChannels = channels.filter((channel) =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectConversation = (conv: Conversation & { id?: number }) => {
    onSelectChat('dm', conv.other_user_id);
    onBack();
  };

  const handleSelectStaff = (staff: typeof allStaff[0]) => {
    onSelectChat('dm', staff.id);
    onBack();
  };

  const handleSelectChannel = (channel: Channel) => {
    onSelectChat('channel', channel.id);
    onBack();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Back Button */}
      <div className="p-2 md:p-4 border-b border-gray-200  flex items-center justify-center md:justify-start gap-2 flex-shrink-0">
        <button
          onClick={onBack}
          className="p-1 hover:bg-gray-200  rounded"
        >
          <ArrowLeft className="w-4 h-4 text-gray-700 " />
        </button>
        <p className="hidden md:block text-[10px] md:text-xs text-gray-600 ">
          Start a chat with someone new or existing
        </p>
      </div>

      {/* Search */}
      <div className="p-2 md:p-3 border-b border-gray-200  flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-2 md:left-2.5 top-1.5 md:top-2 h-3 w-3 md:h-3.5 md:w-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            className="w-full pl-7 md:pl-8 pr-2 md:pr-3 py-1 md:py-1.5 text-xs md:text-sm border border-gray-300  rounded-md focus:ring-2 focus:ring-gray-500  "
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0 group [&::-webkit-scrollbar]:w-0 hover:[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-400 transition-all">
        {/* Channels */}
        {filteredChannels.length > 0 && (
          <div>
            <div className="px-2 md:px-3 py-1.5 md:py-2 sticky top-0 bg-gray-50  border-b border-gray-200  z-10">
              <p className="text-[10px] md:text-xs font-semibold text-gray-600  uppercase">
                Channels
              </p>
            </div>
            {filteredChannels.map((channel) => {
              const bgColorMap: { [key: string]: string } = {
                'transparent': 'bg-transparent',
                'red-500': 'bg-red-500',
                'orange-500': 'bg-orange-500',
                'yellow-500': 'bg-yellow-500',
                'green-500': 'bg-green-500',
                'teal-500': 'bg-teal-500',
                'sky-400': 'bg-sky-400',
                'gray-500': 'bg-gray-500',
                'indigo-500': 'bg-indigo-500',
                'purple-500': 'bg-purple-500',
                'pink-500': 'bg-pink-500',
              };
              const bgColorClass = channel.channel_emoji && channel.channel_emoji_color 
                ? (bgColorMap[channel.channel_emoji_color] || 'bg-indigo-500')
                : 'bg-indigo-500';

              return (
                <button
                  key={`channel-${channel.id}`}
                  onClick={() => handleSelectChannel(channel)}
                  className="w-full px-2 md:px-3 py-2 md:py-2.5 flex items-start gap-2 md:gap-2.5 hover:bg-gray-100  transition-colors text-left"
                >
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-md ${bgColorClass} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    {channel.channel_avatar_url ? (
                      <img src={channel.channel_avatar_url} alt={channel.name} className="w-full h-full object-cover rounded-md" />
                    ) : channel.channel_emoji ? (
                      <span className="text-2xl">{channel.channel_emoji}</span>
                    ) : (
                      <Hash className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900  text-xs md:text-sm truncate">
                      {channel.name}
                    </p>
                    <p className="text-[10px] md:text-xs text-gray-500 ">
                      {channel.member_count} members
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Existing Conversations */}
        {filteredConversations.length > 0 && (
          <div>
            <div className="px-2 md:px-3 py-1.5 md:py-2 sticky top-0 bg-gray-50  border-b border-gray-200  z-10">
              <p className="text-[10px] md:text-xs font-semibold text-gray-600  uppercase">
                Existing Chats
              </p>
            </div>
            {filteredConversations.map((conv) => (
              <button
                key={`dm-${conv.other_user_id}`}
                onClick={() => handleSelectConversation(conv)}
                className="w-full px-2 md:px-3 py-2 md:py-2.5 flex items-start gap-2 md:gap-2.5 hover:bg-gray-100  transition-colors text-left"
              >
                {conv.profilePicUrl ? (
                  <img 
                    src={conv.profilePicUrl} 
                    alt={`${conv.firstName} ${conv.lastName}`}
                    className="w-8 h-8 md:w-10 md:h-10 rounded-md object-cover flex-shrink-0 mt-0.5"
                  />
                ) : (
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-md bg-gray-600 flex items-center justify-center text-white font-semibold text-xs md:text-sm flex-shrink-0 mt-0.5">
                    {conv.firstName[0]}{conv.lastName[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900  text-xs md:text-sm truncate">
                    {conv.firstName} {conv.lastName}
                  </p>
                  <p className="text-[10px] md:text-xs text-gray-500  truncate">
                    {conv.email || `${conv.firstName.toLowerCase()}@company.com`}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* All People - NEW CHATS */}
        {filteredAllPeople.length > 0 && (
          <div>
            <div className="px-2 md:px-3 py-1.5 md:py-2 sticky top-0 bg-gray-50  border-b border-gray-200  z-10">
              <p className="text-[10px] md:text-xs font-semibold text-gray-600  uppercase">
                Start New Chat
              </p>
            </div>
            {filteredAllPeople.map((staff) => (
              <button
                key={`staff-${staff.id}`}
                onClick={() => handleSelectStaff(staff)}
                className="w-full px-2 md:px-3 py-2 md:py-2.5 flex items-start gap-2 md:gap-2.5 hover:bg-gray-100  transition-colors text-left"
              >
                {staff.profilePicUrl ? (
                  <img 
                    src={staff.profilePicUrl} 
                    alt={`${staff.firstName} ${staff.lastName}`}
                    className="w-8 h-8 md:w-10 md:h-10 rounded-md object-cover flex-shrink-0 mt-0.5"
                  />
                ) : (
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-md bg-gray-600 flex items-center justify-center text-white font-semibold text-xs md:text-sm flex-shrink-0 mt-0.5">
                    {staff.firstName[0]}{staff.lastName[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900  text-xs md:text-sm truncate">
                    {staff.firstName} {staff.lastName}
                  </p>
                  <p className="text-[10px] md:text-xs text-gray-500  truncate">
                    {staff.email}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {filteredConversations.length === 0 && filteredChannels.length === 0 && filteredAllPeople.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500 px-4">
            <p className="text-xs md:text-sm text-center">No results found</p>
          </div>
        )}
      </div>
    </div>
  );
}