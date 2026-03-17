import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "@/lib/api";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const [isValidating, setIsValidating] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const validateToken = async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                setIsAuthenticated(false);
                setIsValidating(false);
                return;
            }

            try {
                
                await api.get("/users/me");
                setIsAuthenticated(true);
            } catch (error) {
                
                console.log("Token validation failed, clearing and redirecting to login");
                localStorage.removeItem("token");
                localStorage.removeItem("role");
                setIsAuthenticated(false);
            } finally {
                setIsValidating(false);
            }
        };

        validateToken();
    }, []);

    
    if (isValidating) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
