import { format, isToday, isYesterday, isThisYear } from 'date-fns';

interface MessageDividerProps {
  text: string;
  type: 'date' | 'time';
  date?: Date;
}

export default function MessageDivider({ text, type, date }: MessageDividerProps) {
  if (type === 'date' && date) {
    let displayText = text;
    
    // Check if it's today or yesterday
    if (isToday(date)) {
      displayText = 'TODAY';
    } else if (isYesterday(date)) {
      displayText = 'YESTERDAY';
    } else {
      // Show full date format
      const formatString = isThisYear(date) 
        ? "EEEE, d MMMM"  // WEDNESDAY, 29 JANUARY
        : "EEEE, d MMMM yyyy";  // WEDNESDAY, 29 JANUARY 2023
      displayText = format(date, formatString).toUpperCase();
    }
    
    return (
      <div className="flex items-center justify-center my-4 px-4">
        {/* Left line */}
        <div className="flex-1 border-t border-dashed border-gray-200 "></div>
        
        {/* Date text */}
        <div className="px-3 py-1 rounded-full border border-gray-200  mx-3">
          <span className="text-xs font-medium text-gray-600 ">
            {displayText}
          </span>
        </div>
        
        {/* Right line */}
        <div className="flex-1 border-t border-dashed border-gray-200 "></div>
      </div>
    );
  }

  // Time/user divider - subtle dashed line
  return (
    <div className="flex items-center my-2 px-4">
      <div className="flex-1 border-t border-dashed border-gray-200 "></div>
    </div>
  );
}