import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../../hooks/Auth/useAuth";

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: number[];
}

const RoleBasedRoute = ({ children, allowedRoles }: RoleBasedRouteProps) => {
  const { auth }: any = useAuth();
  const location = useLocation();

  // Not authenticated at all
  if (!auth?.accessToken) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check if user has allowed role
  const hasAllowedRole = auth?.roles?.some((role: number) => 
    allowedRoles.includes(role)
  );

  if (!hasAllowedRole) {
    // Redirect to their correct dashboard based on their role
    const userRole = auth.roles[0];
    
    switch (userRole) {
      case 1:
        return <Navigate to="/superadmin/dashboard" replace />;
      case 2:
        return <Navigate to="/admin/dashboard" replace />;
      case 3:
        return <Navigate to="/provider/dashboard" replace />;
      case 4:
        return <Navigate to="/staff/dashboard" replace />;
      case 5:
        return <Navigate to="/customer/dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default RoleBasedRoute;