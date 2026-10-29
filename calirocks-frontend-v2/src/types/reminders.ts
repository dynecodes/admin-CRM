export interface Reminder {
  id: number;
  userId: number;
  targetType: 'user' | 'channel';
  targetId: number;
  targetName?: string;
  targetAvatar?: string;
  message: string;
  reminderTime: string;
  repeatType: 'none' | 'weekdays' | 'daily' | 'weekly_custom';
  repeatDays?: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  isCompleted: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ReminderTarget {
  id: number;
  name: string;
  type: 'user' | 'channel';
  avatar?: string;
  emoji?: string;
}

export interface CreateReminderDto {
  targets: Array<{ id: number; type: 'user' | 'channel' }>;
  message: string;
  reminderTime: string;
  repeatType: 'none' | 'weekdays' | 'daily' | 'weekly_custom';
  repeatDays?: number[];
}