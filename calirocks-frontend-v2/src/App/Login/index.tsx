import { useLocation, useNavigate } from "react-router-dom";
import axios from "../../api/api";
import useAuth from "../../hooks/Auth/useAuth";
import { useActionState } from "react";

type LoginState = {
  success: boolean;
  error: string;
};

const Login = () => {
  const { setAuth }: any = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname as string | undefined;

  async function submitSetting(
    _prevState: LoginState,
    formData: FormData
  ): Promise<LoginState> {
    const data = {
      user: formData.get("user"),
      pwd: formData.get("pwd"),
    };

    try {
      const response = await axios.post("/auth", data);

      const accessToken = response?.data?.accessToken;
      const roles = response?.data?.roles;
      const user = response?.data?.user;

      setAuth({ roles, accessToken, user });

      // Redirect based on role or previous location
      if (from) {
        navigate(from, { replace: true });
      } else {
        const roleNumber = Number(roles?.[0]);
        console.log("Login role:", roleNumber);

        switch (roleNumber) {
          case 1:
            navigate("/superadmin/dashboard", { replace: true });
            break;
          case 2:
            navigate("/admin/dashboard", { replace: true });
            break;
          case 3:
            navigate("/provider/dashboard", { replace: true });
            break;
          case 4:
            navigate("/staff/dashboard", { replace: true });
            break;
          case 5:
            navigate("/customer/dashboard", { replace: true });
            break;
          case 6:
            navigate("/technical/dashboard", { replace: true });
            break;
          default:
            console.warn("Unknown role:", roles);
            navigate("/", { replace: true });
        }
      }

      return { success: true, error: "" };
    } catch (e: any) {
      console.error("Login failed:", {
        message: e.message,
        status: e.response?.status,
        data: e.response?.data,
        baseURL: e.config?.baseURL,
        url: e.config?.url,
        fullUrl: (e.config?.baseURL || "") + (e.config?.url || ""),
      });

      const status = e.response?.status;
      const errorMsg =
        status === 401
          ? "Invalid username or password"
          : "Login failed. Please try again.";

      return { success: false, error: errorMsg };
    }
  }

  const [state, submitForm, isPending] = useActionState<LoginState, FormData>(
    submitSetting,
    { success: false, error: "" }
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="w-full max-w-md p-8">
        <img
          src="/calilogo.png"
          width={200}
          style={{ paddingBottom: 85 }}
          alt="Logo"
        />
        <div className="mb-8">
          <h2 className="text-2xl font-semibold">Welcome back.</h2>
          <p className="text-gray-500 text-sm">
            Log in to your account below.
          </p>
        </div>

        {state.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {state.error}
          </div>
        )}

        <form action={submitForm} className="space-y-4">
          <div>
            <input
              name="user"
              type="email"
              placeholder="name@company.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
              disabled={isPending}
            />
          </div>
          <div>
            <input
              name="pwd"
              type="password"
              placeholder="Password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
              disabled={isPending}
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-black text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Please wait..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-gray-500">
            Need help logging in?{" "}
            <a href="#" className="text-black font-medium hover:underline">
              Reset your password
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
