import React, { useState, useRef, useEffect } from 'react';
import { TextInput } from "../ui/InputsBundle";

interface SimpleTimePickerProps {
  value: string | null;
  onChange: (time: string) => void;
  className?: string;
}

const SimpleTimePicker: React.FC<SimpleTimePickerProps> = ({ value, onChange, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState(8);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');
  const [inputValue, setInputValue] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value) {
      const [hours, minutes] = value.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours % 12 || 12;
      setSelectedHour(hour12);
      setSelectedMinute(minutes);
      setSelectedPeriod(period);
      
      const pad = (n: number) => n.toString().padStart(2, '0');
      setInputValue(`${pad(hour12)}:${pad(minutes)} ${period}`);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const parseInputTime = (input: string) => {
    // Try to parse formats like: "8:30 AM", "08:30 PM", "8:30", etc.
    const timeRegex = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i;
    const match = input.trim().match(timeRegex);
    
    if (match) {
      let hour = parseInt(match[1]);
      const minute = parseInt(match[2]);
      let period = match[3]?.toUpperCase() as 'AM' | 'PM' | undefined;
      
      // Validate
      if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;
      
      // If no period specified, assume current period
      if (!period) period = selectedPeriod;
      
      return { hour, minute, period };
    }
    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    const parsed = parseInputTime(inputValue);
    if (parsed) {
      updateTime(parsed.hour, parsed.minute, parsed.period);
    } else {
      // Reset to current value if invalid
      const pad = (n: number) => n.toString().padStart(2, '0');
      setInputValue(`${pad(selectedHour)}:${pad(selectedMinute)} ${selectedPeriod}`);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const parsed = parseInputTime(inputValue);
      if (parsed) {
        updateTime(parsed.hour, parsed.minute, parsed.period);
      }
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const updateTime = (hour: number, minute: number, period: 'AM' | 'PM') => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setSelectedPeriod(period);
    
    let hour24 = hour % 12;
    if (period === 'PM') hour24 += 12;
    if (period === 'AM' && hour === 12) hour24 = 0;
    
    const pad = (n: number) => n.toString().padStart(2, '0');
    const formattedTime = `${pad(hour24)}:${pad(minute)}`;
    onChange(formattedTime);
    setInputValue(`${pad(hour)}:${pad(minute)} ${period}`);
  };

  const handleDropdownSelect = (hour: number, minute: number, period: 'AM' | 'PM') => {
    updateTime(hour, minute, period);
    // Keep dropdown open - don't close it
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <TextInput
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder="HH:MM AM/PM"
          className={`pr-8 cursor-text h-8.5 ${isOpen ? "ring-1 ring-gray-400" : ""}`}
        />

      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="grid grid-cols-3 gap-2 p-3 max-h-48">
            {/* Hours */}
            <div className="overflow-y-auto max-h-40 scrollbar-hide [&::-webkit-scrollbar]:w-0 hover:[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-400">
            <div className="text-[10px] font-medium text-gray-600 mb-1 text-center sticky top-0 bg-white">Hour</div>
            {hours.map((hour) => (
                <button
                key={hour}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleDropdownSelect(hour, selectedMinute, selectedPeriod)}
                className={`w-full px-2 py-1 cursor-pointer text-xs rounded hover:bg-gray-50 ${
                    hour === selectedHour ? 'bg-gray-50 text-gray-700 font-medium' : 'text-gray-900'
                }`}
                >
                {hour.toString().padStart(2, '0')}
                </button>
            ))}
            </div>

            {/* Minutes */}
            <div className="overflow-y-auto max-h-40 scrollbar-hide [&::-webkit-scrollbar]:w-0 hover:[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-400">
            <div className="text-[10px] font-medium text-gray-600 mb-1 text-center sticky top-0 bg-white">Min</div>
            {minutes.map((minute) => (
                <button
                key={minute}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleDropdownSelect(selectedHour, minute, selectedPeriod)}
                className={`w-full px-2 py-1 cursor-pointer text-xs rounded hover:bg-gray-50 ${
                    minute === selectedMinute ? 'bg-gray-50 text-gray-700 font-medium' : 'text-gray-900'
                }`}
                >
                {minute.toString().padStart(2, '0')}
                </button>
            ))}
            </div>

            {/* AM/PM */}
            <div>
              <div className="text-[10px] font-medium text-gray-600 mb-1 text-center sticky top-0 bg-white">Period</div>
              {(['AM', 'PM'] as const).map((period) => (
                <button
                  key={period}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleDropdownSelect(selectedHour, selectedMinute, period)}
                  className={`w-full px-2 py-1 cursor-pointer text-xs rounded hover:bg-gray-50 ${
                    period === selectedPeriod ? 'bg-gray-50 text-gray-700 font-medium' : 'text-gray-900'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleTimePicker;