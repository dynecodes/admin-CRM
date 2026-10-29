import React, { useState } from 'react';
import { X, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import SetReminderForm from './SetReminderForm';
import { Reminder, ReminderTarget } from '../../types/reminders';

interface RemindersPanelProps {
  onClose: () => void;
  upcomingReminders: Reminder[];
  completedReminders: Reminder[];
  onCreateReminder: (reminder: any) => void;
  onCompleteReminder: (id: number) => void;
  availableTargets: ReminderTarget[];
  initialMessage?: string;
}

const RemindersPanel: React.FC<RemindersPanelProps> = ({
  onClose,
  upcomingReminders,
  completedReminders,
  onCreateReminder,
  availableTargets,
  initialMessage,
}) => {
  const [showSetReminder, setShowSetReminder] = useState(!!initialMessage);
  const [showCompleted, setShowCompleted] = useState(false);

  const formatReminderTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const reminderDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const time = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    if (reminderDate.getTime() === today.getTime()) {
      return `${time} | Today`;
    } else if (reminderDate.getTime() === tomorrow.getTime()) {
      return `${time} | Tomorrow`;
    } else {
      return `${time} | ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
  };

  if (showSetReminder) {
    return (
      <SetReminderForm
        onClose={onClose}
        onBack={() => setShowSetReminder(false)}
        onCreate={onCreateReminder}
        availableTargets={availableTargets}
        initialMessage={initialMessage}
      />
    );
  }

  return (
    <div className="w-[370px] bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h2 className="text-base font-semibold text-gray-900">Reminders</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Set a reminder button */}
        <button
          onClick={() => setShowSetReminder(true)}
          className="w-full px-4 py-3 flex items-center gap-3 text-purple-600 hover:bg-purple-50 transition-colors border-b border-gray-200"
        >
          <Clock size={18} className="text-purple-600" />
          <span className="text-sm font-medium cursor-pointer">Set a reminder</span>
        </button>

        {/* Upcoming Reminders Section */}
        <div className="px-4 py-3">
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3 px-1">
            UPCOMING REMINDERS
          </h3>

          {upcomingReminders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="relative mb-6">
                <Clock size={56} className="text-purple-400" />
                <div className="absolute -top-2 -right-2">
                  <div className="w-6 h-6 bg-purple-400 rounded-full flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
                      <path d="M10 3L4.5 8.5L2 6" strokeWidth="2" stroke="white" fill="none" />
                    </svg>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 text-center mb-6">
                All done! You do not have any upcoming reminders
              </p>
              <button
                onClick={() => setShowSetReminder(true)}
                className="w-full bg-purple-500 hover:bg-purple-600 cursor-pointer text-white text-sm font-medium py-2.5 px-6 rounded-md transition-colors"
              >
                Set Reminder
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="bg-gray-50 rounded-md p-3 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-0.5">{reminder.message}</p>
                      <p className="text-xs text-gray-600">
                        Remind {reminder.targetName || 'Me'}
                      </p>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600 ml-2">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                        <circle cx="8" cy="4" r="1.5" />
                        <circle cx="8" cy="8" r="1.5" />
                        <circle cx="8" cy="12" r="1.5" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">{formatReminderTime(reminder.reminderTime)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Show/Hide Completed */}
        <div className="border-t border-gray-200">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="w-full px-4 py-2.5 flex cursor-pointer items-center justify-between text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <span className="uppercase">{showCompleted ? 'Hide completed' : 'Show completed'}</span>
            {showCompleted ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showCompleted && (
            <div className="px-4 py-3 space-y-2 bg-gray-50">
              {completedReminders.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">No completed reminders</p>
              ) : (
                completedReminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="bg-white rounded-md p-3 opacity-60"
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 mb-0.5 line-through">
                          {reminder.message}
                        </p>
                        <p className="text-xs text-gray-600">
                          Remind {reminder.targetName || 'Me'}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatReminderTime(reminder.reminderTime)}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RemindersPanel;