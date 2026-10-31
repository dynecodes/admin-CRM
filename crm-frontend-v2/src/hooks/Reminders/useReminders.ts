import { useState, useEffect } from 'react';
import { Reminder, CreateReminderDto } from '../../types/reminders';
import usePrivateService from '../Auth/usePrivateService';

export const useReminders = () => {
  const privateService = usePrivateService();
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);
  const [completedReminders, setCompletedReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all reminders
  const fetchReminders = async () => {
    try {
      setLoading(true);
      const response = await privateService.get('/reminders');
      const reminders: Reminder[] = response.data;

      setUpcomingReminders(reminders.filter((r) => !r.isCompleted));
      setCompletedReminders(reminders.filter((r) => r.isCompleted));
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch reminders');
      console.error('Error fetching reminders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create a new reminder
  const createReminder = async (data: CreateReminderDto) => {
    try {
      setLoading(true);
      const response = await privateService.post('/reminders', data);
      const newReminder: Reminder = response.data;

      setUpcomingReminders((prev) => [...prev, newReminder]);
      setError(null);
      return newReminder;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create reminder');
      console.error('Error creating reminder:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Complete a reminder
  const completeReminder = async (id: number) => {
    try {
      await privateService.put(`/reminders/${id}/complete`);

      const reminder = upcomingReminders.find((r) => r.id === id);
      if (reminder) {
        setUpcomingReminders((prev) => prev.filter((r) => r.id !== id));
        setCompletedReminders((prev) => [...prev, { ...reminder, isCompleted: true }]);
      }
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to complete reminder');
      console.error('Error completing reminder:', err);
      throw err;
    }
  };

  // Delete a reminder
  const deleteReminder = async (id: number) => {
    try {
      await privateService.delete(`/reminders/${id}`);

      setUpcomingReminders((prev) => prev.filter((r) => r.id !== id));
      setCompletedReminders((prev) => prev.filter((r) => r.id !== id));
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete reminder');
      console.error('Error deleting reminder:', err);
      throw err;
    }
  };

  // Fetch reminders on mount
  useEffect(() => {
    fetchReminders();
  }, []);

  return {
    upcomingReminders,
    completedReminders,
    loading,
    error,
    createReminder,
    completeReminder,
    deleteReminder,
    refreshReminders: fetchReminders,
  };
};

export default useReminders;