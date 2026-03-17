import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";

const PlayerRedirect = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const redirectToCurrentBook = async () => {
            try {
                
                const response = await api.get("/books/now-playing");

                if (response.data && response.data.id) {
                    
                    navigate(`/player/${response.data.id}`, { replace: true });
                } else {
                    
                    navigate("/library", { replace: true });
                }
            } catch (error) {
                console.error("Failed to fetch now playing book:", error);
                
                navigate("/library", { replace: true });
            }
        };

        redirectToCurrentBook();
    }, [navigate]);

    
    return (
        <div className="min-h-screen gradient-hero flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-foreground">Loading your book...</p>
            </div>
        </div>
    );
};

export default PlayerRedirect;
