import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "../../api/api";
import { Button, Label, HelperText } from "flowbite-react";

const SetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setError("Invalid invitation link");
      setIsVerifying(false);
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await axios.get(`/staff/verify-token?token=${token}`);
      if (response.data.success) {
        setUserInfo(response.data.data);
        console.log('✅ Token verified successfully');
      }
    } catch (err: any) {
      console.error('❌ Token verification failed:', err);
      setError(err.response?.data?.message || "Invalid or expired invitation link");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post("/staff/set-password", {
        token,
        password,
      });

      if (response.data.success) {
        alert("✅ " + response.data.message);
        navigate("/");
      }
    } catch (err: any) {
      console.error('❌ Password set failed:', err);
      setError(err.response?.data?.message || "Failed to set password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while verifying token
  if (isVerifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Verifying invitation...</p>
        </div>
      </div>
    );
  }

  // Error state - invalid or expired token
  if (error && !userInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Invalid Invitation</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500 mb-6">
            The invitation link may have expired (links expire after 24 hours) or is invalid. 
            Please contact your administrator for a new invitation.
          </p>
          <Button color="blue" onClick={() => navigate("/")} className="cursor-pointer">
            Go to Login Page
          </Button>
        </div>
      </div>
    );
  }

  // Main password setup form
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 px-8 py-6 text-white text-center">
            <h1 className="text-3xl font-bold">Welcome!</h1>
            {userInfo && (
              <>
                <p className="mt-2 text-blue-100">Hi {userInfo.name}</p>
                <p className="text-sm text-blue-200">Set your password to get started at {userInfo.companyName}</p>
              </>
            )}
          </div>

          {/* Form */}
          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Create Password
                </Label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full px-4 py-2.5 border border-gray-300 rounded-lg 
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                           transition-colors"
                  required
                  minLength={8}
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <HelperText className="mt-1.5 text-xs text-gray-500">
                  Must be at least 8 characters long
                </HelperText>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Confirm Password
                </Label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 w-full px-4 py-2.5 border border-gray-300 rounded-lg 
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                           transition-colors"
                  required
                  placeholder="Re-enter your password"
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full cursor-pointer mt-6"
                color="blue"
                size="lg"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Setting Password...
                  </span>
                ) : (
                  "Set Password & Continue"
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <button
                  onClick={() => navigate("/")}
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                  disabled={isLoading}
                >
                  Login here
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-sm text-gray-500 mt-6">
          🔒 This invitation link expires in 24 hours for security
        </p>
      </div>
    </div>
  );
};

export default SetPassword;