import { privateService } from "./api";

export interface Staff {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  role: string;
  confirmed: boolean;
  profilePicUrl?: string | null;
  emailPreferences?: any;
  created_at?: string;
  updated_at?: string;
}

export const staffApi = {
  // Get all staff
  getAll: async (): Promise<{ success: boolean; data: Staff[] }> => {
    const response = await privateService.get('/staff');
    return response.data;
  },

  // Update profile picture
  updateProfilePicture: async (
    userId: number,
    imageFile: string
  ): Promise<{ success: boolean; data: Staff }> => {
    const response = await privateService.put(`/staff/${userId}/profile-picture`, {
      imageFile
    });
    return response.data;
  },

  // Update staff details
  update: async (
    userId: number,
    data: Partial<Staff>
  ): Promise<{ success: boolean; message: string }> => {
    const response = await privateService.put(`/staff/${userId}`, data);
    return response.data;
  }
};