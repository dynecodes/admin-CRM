import { useEffect } from 'react';
import useAuth from './useAuth';
import useRefreshToken from './useRefreshService';

export default function useAuthRefresh() {
  const { auth }: any = useAuth();
  const refresh = useRefreshToken();

  useEffect(() => {
    const handleVisibilityChange = async () => {
      // When user comes back to the app
      if (!document.hidden && auth?.accessToken) {
        console.log('App became visible, refreshing auth...');
        try {
          await refresh();
          console.log('Auth refreshed on visibility change');
        } catch (error) {
          console.error('Failed to refresh on visibility change:', error);
        }
      }
    };

    // Listen for when user switches back to the app
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [auth?.accessToken, refresh]);
}