import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <p className="text-gray-500 text-sm p-6">Memuat...</p>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}
