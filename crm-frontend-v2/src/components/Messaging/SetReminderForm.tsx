import React, { useState, useRef, useEffect } from 'react';
import { X, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { ReminderTarget, CreateReminderDto } from '../../types/reminders';
import DatePicker from '../ui/DatePicker';
import SimpleTimePicker from '../ui/SimpleTimePicker';

interface SetReminderFormProps {
  onClose: () => void;
  onBack: () => void;
  onCreate: (reminder: CreateReminderDto) => void;
  availableTargets?: ReminderTarget[];
  initialMessage?: string;
}

const SetReminderForm: React.FC<SetReminderFormProps> = ({
  onClose,
  onBack,
  onCreate,
  availableTargets = [],
  initialMessage,
}) => {
  const [selectedTargets, setSelectedTargets] = useState<ReminderTarget[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState(initialMessage || '');
  const [selectedQuickTime, setSelectedQuickTime] = useState<string | null>(null);
  const [showCustomTime, setShowCustomTime] = useState(false);
  const [customDate, setCustomDate] = useState<Date | null>(null);
  const [customTime, setCustomTime] = useState<string | null>(null);
  const [repeatType, setRepeatType] = useState<'none' | 'weekdays' | 'daily' | 'weekly_custom'>('none');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [showRepeatDropdown, setShowRepeatDropdown] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const daysOfWeek = [
    { label: 'S', value: 0, name: 'Sunday' },
    { label: 'M', value: 1, name: 'Monday' },
    { label: 'T', value: 2, name: 'Tuesday' },
    { label: 'W', value: 3, name: 'Wednesday' },
    { label: 'T', value: 4, name: 'Thursday' },
    { label: 'F', value: 5, name: 'Friday' },
    { label: 'S', value: 6, name: 'Saturday' },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTargets = availableTargets.filter((target) =>
    target.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTargetSelect = (target: ReminderTarget) => {
    if (!selectedTargets.find((t) => t.id === target.id && t.type === target.type)) {
      setSelectedTargets([...selectedTargets, target]);
    }
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleTargetRemove = (target: ReminderTarget) => {
    setSelectedTargets(selectedTargets.filter((t) => !(t.id === target.id && t.type === target.type)));
  };

  const handleQuickTimeSelect = (type: string) => {
    setSelectedQuickTime(type);
    setShowCustomTime(false);
    setCustomDate(null);
    setCustomTime(null);
  };

  const calculateReminderTime = () => {
    if (customDate && customTime) {
      const [hours, minutes] = customTime.split(':').map(Number);
      const dateTime = new Date(customDate);
      dateTime.setHours(hours, minutes, 0, 0);
      
      // Format as ISO string but preserve local timezone
      const year = dateTime.getFullYear();
      const month = String(dateTime.getMonth() + 1).padStart(2, '0');
      const day = String(dateTime.getDate()).padStart(2, '0');
      const hour = String(dateTime.getHours()).padStart(2, '0');
      const minute = String(dateTime.getMinutes()).padStart(2, '0');
      const second = '00';
      
      return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
    }

    const now = new Date();
    const futureTime = new Date();
    
    switch (selectedQuickTime) {
      case '15min':
        futureTime.setTime(now.getTime() + 15 * 60000);
        break;
      case '30min':
        futureTime.setTime(now.getTime() + 30 * 60000);
        break;
      case '1hour':
        futureTime.setTime(now.getTime() + 60 * 60000);
        break;
      default:
        futureTime.setTime(now.getTime() + 60 * 60000);
    }
    
    // Format as ISO string but preserve local timezone
    const year = futureTime.getFullYear();
    const month = String(futureTime.getMonth() + 1).padStart(2, '0');
    const day = String(futureTime.getDate()).padStart(2, '0');
    const hour = String(futureTime.getHours()).padStart(2, '0');
    const minute = String(futureTime.getMinutes()).padStart(2, '0');
    const second = '00';
    
    return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  };

  const getPreviewText = () => {
    if (!customDate && !customTime && !selectedQuickTime) return '';

    const reminderDate = new Date(calculateReminderTime());
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const reminderDateOnly = new Date(
      reminderDate.getFullYear(),
      reminderDate.getMonth(),
      reminderDate.getDate()
    );

    const time = reminderDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    let dayText = '';
    if (reminderDateOnly.getTime() === today.getTime()) {
      dayText = 'Today';
    } else if (reminderDateOnly.getTime() === tomorrow.getTime()) {
      dayText = 'Tomorrow';
    } else {
      dayText = reminderDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }

    let repeatText = '';
    if (repeatType === 'weekdays') {
      repeatText = ', Every Mon-Fri';
    } else if (repeatType === 'daily') {
      repeatText = ', Daily';
    } else if (repeatType === 'weekly_custom' && selectedDays.length > 0) {
      const dayNames = selectedDays
        .sort((a, b) => a - b)
        .map((d) => daysOfWeek[d].name.substring(0, 3))
        .join(', ');
      repeatText = `, Every ${dayNames}`;
    }

    return `${dayText}, ${time}${repeatText}`;
  };

  const handleSubmit = () => {
    if (!message.trim()) {
      alert('Please enter a reminder message');
      return;
    }

    if (!customDate && !customTime && !selectedQuickTime) {
      alert('Please select a reminder time');
      return;
    }

    const reminderData: CreateReminderDto = {
      targets: selectedTargets.length > 0 
        ? selectedTargets.map(t => ({ id: t.id, type: t.type }))
        : [{ id: 0, type: 'user' as const }], // Default to "Me"
      message: message.trim(),
      reminderTime: calculateReminderTime(),
      repeatType,
      repeatDays: repeatType === 'weekly_custom' ? selectedDays : undefined,
    };

    onCreate(reminderData);
    onBack();
  };

  const handleDayToggle = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const getRepeatLabel = () => {
    switch (repeatType) {
      case 'weekdays':
        return 'Weekdays (Mon-Fri)';
      case 'daily':
        return 'Daily';
      case 'weekly_custom':
        return 'Weekly (Custom)';
      default:
        return 'Do not repeat';
    }
  };

  return (
    <div className="w-[380px] bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft size={18} className="cursor-pointer"/>
          </button>
          <h2 className="text-base font-semibold text-gray-900">Set a Reminder</h2>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Reminder for */}
        <div className="mb-4" ref={dropdownRef}>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Reminder for <span className="text-gray-400">(Channel or contacts)</span>
          </label>
          <div className="relative">
            <div className="w-full min-h-[38px] px-3 py-2 border border-gray-300 rounded-md bg-white flex flex-wrap items-center gap-1.5 focus-within:ring-0 focus-within:ring-offset-0 focus-within:outline-none focus-within:shadow-none">
              {/* Selected chips */}
              {selectedTargets.map((target) => (
                <div
                  key={`${target.type}-${target.id}`}
                  className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium flex items-center gap-1 flex-shrink-0"
                >
                  <span className="max-w-[150px] truncate">{target.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTargetRemove(target);
                    }}
                    className="text-blue-700 hover:text-blue-900 flex-shrink-0"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              
              {/* Input field */}
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder={selectedTargets.length === 0 ? 'Contact or Channel' : ''}
                className="flex-1 min-w-[120px] text-xs outline-none border-none bg-transparent p-0 focus:ring-0 focus:ring-offset-0 focus:outline-none focus:shadow-none"
                style={{ minHeight: '20px' }}
              />
            </div>

            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredTargets.length === 0 ? (
                  <div className="px-3 py-2.5 text-xs text-gray-500">
                    {searchQuery ? `No results for "${searchQuery}"` : 'Start typing to search...'}
                  </div>
                ) : (
                  filteredTargets.map((target) => (
                    <button
                      key={`${target.type}-${target.id}`}
                      onClick={() => handleTargetSelect(target)}
                      className="w-full px-3 py-2.5 text-left hover:bg-gray-50 flex items-center gap-2.5"
                    >
                      {target.avatar ? (
                        <img
                          src={target.avatar}
                          alt={target.name}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                      ) : target.emoji ? (
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-base">
                          {target.emoji}
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                          {target.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{target.name}</div>
                        <div className="text-xs text-gray-500 capitalize">{target.type}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Remind about */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Remind about</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="A task, meeting or something else..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none text-sm"
          />
        </div>

        {/* Remind in */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-2">Remind in</label>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <button
              onClick={() => handleQuickTimeSelect('15min')}
              className={`py-2.5 px-3 cursor-pointer rounded-md border-2 text-xs font-medium transition-colors ${
                selectedQuickTime === '15min'
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-base font-semibold">15</div>
              <div className="text-[10px]">minutes</div>
            </button>
            <button
              onClick={() => handleQuickTimeSelect('30min')}
              className={`py-2.5 px-3 cursor-pointer rounded-md border-2 text-xs font-medium transition-colors ${
                selectedQuickTime === '30min'
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-base font-semibold">30</div>
              <div className="text-[10px]">minutes</div>
            </button>
            <button
              onClick={() => handleQuickTimeSelect('1hour')}
              className={`py-2.5 px-3 cursor-pointer rounded-md border-2 text-xs font-medium transition-colors ${
                selectedQuickTime === '1hour'
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-base font-semibold">1</div>
              <div className="text-[10px]">hour</div>
            </button>
          </div>

          {/* Select custom time and repeat */}
          <button
            onClick={() => {
              setShowCustomTime(!showCustomTime);
              if (!showCustomTime) {
                setSelectedQuickTime(null);
              }
            }}
            className="w-full flex items-center cursor-pointer justify-between text-purple-600 font-medium text-xs py-2"
          >
            <span>Select custom time and repeat</span>
            {showCustomTime ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showCustomTime && (
            <div className="mt-3 space-y-3 p-3 bg-gray-50 rounded-md">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-1">Date</label>
                  <DatePicker
                    value={customDate}
                    onChange={(date) => setCustomDate(date)}
                    placeholder="Select date"
                    inputClassName="text-xs py-1.5 px-2.5 pr-8"
                    
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-1">Time</label>
                  <SimpleTimePicker
                    value={customTime}
                    onChange={(time) => setCustomTime(time)}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Repeat dropdown */}
              <div className="relative">
                <label className="block text-[10px] font-medium text-gray-700 mb-1">Repeat</label>
                <button
                  onClick={() => setShowRepeatDropdown(!showRepeatDropdown)}
                  className="w-full px-2.5 py-1.5 cursor-pointer border border-gray-300 rounded-md text-xs text-left flex items-center justify-between hover:border-gray-600 hover:ring-gray-500 hover:ring-1 bg-white "
                >
                  <span>{getRepeatLabel()}</span>
                  <ChevronDown size={14} />
                </button>

                {showRepeatDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                    <button
                      onClick={() => {
                        setRepeatType('none');
                        setShowRepeatDropdown(false);
                        setSelectedDays([]);
                      }}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 flex items-center justify-between"
                    >
                      Do not repeat
                      {repeatType === 'none' && (
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M13.5 3.5L6 11L2.5 7.5" stroke="currentColor" strokeWidth="2" fill="none" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setRepeatType('weekdays');
                        setShowRepeatDropdown(false);
                        setSelectedDays([]);
                      }}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 flex items-center justify-between"
                    >
                      Weekdays (Mon-Fri)
                      {repeatType === 'weekdays' && (
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M13.5 3.5L6 11L2.5 7.5" stroke="currentColor" strokeWidth="2" fill="none" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setRepeatType('daily');
                        setShowRepeatDropdown(false);
                        setSelectedDays([]);
                      }}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 flex items-center justify-between"
                    >
                      Daily
                      {repeatType === 'daily' && (
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M13.5 3.5L6 11L2.5 7.5" stroke="currentColor" strokeWidth="2" fill="none" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setRepeatType('weekly_custom');
                        setShowRepeatDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 flex items-center justify-between"
                    >
                      Weekly (Custom)
                      {repeatType === 'weekly_custom' && (
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M13.5 3.5L6 11L2.5 7.5" stroke="currentColor" strokeWidth="2" fill="none" />
                        </svg>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Weekly custom - days selection */}
              {repeatType === 'weekly_custom' && (
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-1.5">Repeat on</label>
                  <div className="flex gap-1.5">
                    {daysOfWeek.map((day) => (
                      <button
                        key={day.value}
                        onClick={() => handleDayToggle(day.value)}
                        className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          selectedDays.includes(day.value)
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Preview */}
        {getPreviewText() && (
          <div className="mb-4 text-center">
            <p className="text-xs text-gray-600">{getPreviewText()}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200">
        <button
          onClick={handleSubmit}
          className="w-full bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium py-2.5 px-4 rounded-md transition-colors"
        >
          Set Reminder
        </button>
      </div>
    </div>
  );
};

export default SetReminderForm;