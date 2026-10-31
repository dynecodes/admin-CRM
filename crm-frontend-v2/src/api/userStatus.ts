import { privateService } from './api';

export interface UserStatus {
  status_type: 'available' | 'busy' | 'away' | 'leave' | 'custom';
  custom_status?: string | null;
}

export interface UserStatusWithDetails extends UserStatus {
  user_id: number;
  firstName: string;
  lastName: string;
  updated_at: string;
}

export const userStatusApi = {
  // Get current user's status
  getUserStatus: async (): Promise<UserStatus> => {
    const response = await privateService.get('/user-status');
    return response.data.data;
  },

  // Update current user's status
  updateUserStatus: async (statusType: string, customStatus?: string): Promise<UserStatus> => {
    const response = await privateService.put('/user-status', {
      statusType,
      customStatus: customStatus || null
    });
    return response.data.data;
  },

  // Get all users' statuses (for the company)
  getAllUserStatuses: async (): Promise<UserStatusWithDetails[]> => {
    const response = await privateService.get('/user-status/all');
    return response.data.data;
  }
};

export const getDoNotDisturb = async (privateService: any) => {
  const response = await privateService.get("/user-status/dnd");
  return response.data.data;
};

export const updateDoNotDisturb = async (privateService: any, doNotDisturb: boolean) => {
  const response = await privateService.put("/user-status/dnd", { doNotDisturb });
  return response.data.data;
};