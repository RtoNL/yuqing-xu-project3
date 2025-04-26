import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();

  console.log("🔐 [PrivateRoute] loading:", loading);
  console.log("🔐 [PrivateRoute] isAuthenticated:", isAuthenticated);
  console.log("🔐 [PrivateRoute] user:", user);

  if (loading) {
    // Wait for authentication status to be confirmed
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    // Redirect to login if user is not authenticated
    return <Navigate to="/login" replace />;
  }

  // Render the protected component if user is authenticated
  return children;
}
