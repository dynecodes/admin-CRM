import { useEffect, useState } from "react";
import useAuth from "./useAuth";
import useRefreshToken from "./useRefreshService";

export default function usePersistLogin() {
    const [isLoading, setIsLoading] = useState(true);
    const refresh = useRefreshToken();
    const { auth }: any = useAuth();

    useEffect(() => {
        let isMounted = true;

        const verifyRefreshToken = async () => {
            try {
                await refresh();
            } catch (err) {
                console.error("Refresh token verification failed:", err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        // only check if we don't have auth data
        if (!auth?.accessToken) {
            verifyRefreshToken();
        } else {
            setIsLoading(false);
        }

        return () => {
            isMounted = false;
        };
    }, []); // keep empty - we only want this to run once on mount

    return { isLoading };
}