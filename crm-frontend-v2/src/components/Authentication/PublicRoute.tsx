import { Navigate } from "react-router-dom";
import useAuth from "../../hooks/Auth/useAuth";

const PublicRoute = ({ children }: any) => {
  const { auth }: any = useAuth();

  // If user is logged in, redirect based on their role
  if (auth?.accessToken && auth?.roles) {
    const role = auth.roles[0];
    
    switch (role) {
      case 1: // SuperAdmin
        return <Navigate to="/superadmin/dashboard" replace />;
      case 2: // Admin
        return <Navigate to="/admin/dashboard" replace />;
      case 3: // Provider
        return <Navigate to="/provider/dashboard" replace />;
      case 4: // Staff
        return <Navigate to="/staff/dashboard" replace />;
      case 5: // Customer
        return <Navigate to="/customer/dashboard" replace />;
      case 6: // Technical Admin
        return <Navigate to="/technical/dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  // Otherwise, show the public page (login)
  return children;
};

export default PublicRoute;