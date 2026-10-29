import * as React from "react";
import { Staff } from "../../types/staffs";
import usePrivateService from "../Auth/usePrivateService";

type Updater<T> = (items: T[]) => T[];

export function useStaffs() {
  const [staffs, setStaffs] = React.useState<Staff[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const privateService = usePrivateService();

  React.useEffect(() => {
    fetchStaffs();
  }, []);

  const fetchStaffs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await privateService.get('/staff');
      if (response.data.success) {
        const mappedStaffs = response.data.data.map((s: any) => ({
          id: s.id,
          email: s.email,
          firstName: s.firstName,
          lastName: s.lastName,
          role: s.role,
          twoFAEnabled: s.twoFAEnabled || false,
          confirmed: s.confirmed,
          phone: s.phone,
          address: s.address,
          city: s.city,
          state: s.state,
          zip: s.zip,
          profilePicUrl: s.profilePicUrl,
          created_at: s.created_at,
          updated_at: s.updated_at,
          emailPreferences: s.emailPreferences ? JSON.parse(typeof s.emailPreferences === 'string' ? s.emailPreferences : JSON.stringify(s.emailPreferences)) : undefined,
        }));
        setStaffs(mappedStaffs);
      }
    } catch (err: any) {
      console.error('Error fetching staff:', err);
      setError(err.response?.data?.message || 'Failed to fetch staff');
    } finally {
      setIsLoading(false);
    }
  };

  const set: (u: Updater<Staff>) => void = (u) =>
    setStaffs((prev) => u([...prev]));

  const addStaff = async (s: Omit<Staff, "id" | "created_at" | "updated_at">) => {
    try {
      const response = await privateService.post('/staff', s);
      if (response.data.success) {
        await fetchStaffs();
      }
    } catch (err) {
      console.error('Error adding staff:', err);
    }
  };

  const updateStaff = async (id: number, patch: Partial<Staff>) => {
    try {
      const response = await privateService.put(`/staff/${id}`, patch);
      if (response.data.success) {
        set((list) =>
          list.map((s) =>
            s.id === id
              ? { ...s, ...patch, updated_at: new Date().toISOString() }
              : s,
          ),
        );
      }
    } catch (err) {
      console.error('Error updating staff:', err);
    }
  };

  const removeStaff = (id: number) => {
    set((list) => list.filter((s) => s.id !== id));
  };

  const getById = (id: number) => staffs.find((s) => s.id === id);

  return { staffs, addStaff, updateStaff, removeStaff, getById, fetchStaffs, isLoading, error };
}