import { isSameDay } from 'date-fns';

export function addDateTimeDividers(messages: any[]): any[] {
  if (messages.length === 0) return [];

  const result: any[] = [];
  let lastDate: Date | null = null;
  let lastSenderId: number | null = null;

  messages.forEach((message, _index) => {
    const messageDate = new Date(message.createdAt);
    const senderId = 'senderId' in message ? message.senderId : (message as any).senderId;

    // Add date divider if date changes
    if (!lastDate || !isSameDay(lastDate, messageDate)) {
      result.push({
        type: 'date-divider',
        dividerText: '', // Will be formatted in component
        dividerDate: messageDate,
      });
      lastDate = messageDate;
      lastSenderId = null; // Reset sender tracking on new date
    } 
    // Add user divider if sender changes (but not for system messages or after date divider)
    else if (lastSenderId !== null && lastSenderId !== senderId && senderId !== 0) {
      result.push({
        type: 'time-divider',
        dividerText: '',
      });
    }

    result.push({
      type: 'message',
      data: message,
    });

    lastSenderId = senderId !== 0 ? senderId : lastSenderId; // Don't update for system messages
  });

  return result;
}