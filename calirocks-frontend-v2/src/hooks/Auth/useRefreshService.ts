import axios from "../../api/api";
import useAuth from "./useAuth";

export default function useRefreshToken() {
    const { setAuth }: any = useAuth();

    const refresh = async () => {
        console.log("Frontend: Calling refresh endpoint...");
        
        try {
            const response = await axios.post("/auth/refresh", {}, { withCredentials: true });          
            console.log("Frontend: Refresh response received:", {
                hasAccessToken: !!response.data.accessToken,
                hasRoles: !!response.data.roles,
                hasUser: !!response.data.user,
            });
            
            setAuth((prev: any) => {
                const newAuth = { 
                    ...prev, 
                    accessToken: response.data.accessToken,
                    roles: response.data.roles, 
                    user: response.data.user     
                };
                console.log("Frontend: Auth state updated:", newAuth);
                return newAuth;
            });
            
            return response.data.accessToken;
        } catch (error) {
            console.error("Frontend: Refresh failed:", error);
            throw error;
        }
    };
    
    return refresh;
}