import { privateService } from "../../api/api";
import { useEffect } from "react";
import useRefreshToken from "./useRefreshService";
import useAuth from "./useAuth";

const usePrivateService = () => {
  const refresh = useRefreshToken();
  const { auth }: any = useAuth();
  
  useEffect(() => {
    const requestIntercept = privateService.interceptors.request.use(
      (config: any) => {
        if (!config.headers["Authorization"] && auth?.accessToken) {
          config.headers["Authorization"] = `Bearer ${auth.accessToken}`;
        }
        return config;
      },
      (error: any) => Promise.reject(error),
    );

    const responseIntercept = privateService.interceptors.response.use(
      (response: any) => response,
      async (error: any) => {
        const prevRequest = error?.config;
        
        // Check for 401 or 403 and ensure we haven't retried yet
        if ((error?.response?.status === 401 || error?.response?.status === 403) && !prevRequest?.sent) {
          prevRequest.sent = true;
          
          try {
            const newAccessToken = await refresh();
            prevRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
            return privateService(prevRequest);
          } catch (refreshError) {
            // If refresh fails, redirect to login
            window.location.href = "/";
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      },
    );

    return () => {
      privateService.interceptors.request.eject(requestIntercept);
      privateService.interceptors.response.eject(responseIntercept);
    };
  }, [auth?.accessToken, refresh]);

  return privateService;
};

export default usePrivateService;