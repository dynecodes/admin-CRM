import axios from "../../api/api";
import useAuth from "./useAuth";

export default function useLogout() {
  const { setAuth }: any = useAuth();

  const logout = async () => {
    setAuth({});
    try {
      await axios.get("/logout", {
        withCredentials: true,
      });
    } catch (err) {
      console.error(err);
    }
  };

  return logout;
}