import { Link, useLocation } from "react-router-dom";
import { Home, Library, User, Trophy, Headphones, Flame, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import api from "@/lib/api";

const Navigation = () => {
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    const [streak, setStreak] = useState(0);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;
            try {
                const res = await api.get("/users/me");
                setUser(res.data);
                setStreak(res.data.current_streak || 0);
            } catch (e) {
                console.error("Failed to fetch user");
            }
        };
        fetchUser();
    }, []);

    const navItems = [
        { path: "/", icon: Home, label: "Home" },
        { path: "/library", icon: Library, label: "Library" },
        { path: "/social", icon: Users, label: "Social" },
        { path: "/player", icon: Headphones, label: "Player" },
        { path: "/achievements", icon: Trophy, label: "Achievements" },
        { path: "/profile", icon: User, label: "Profile" },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
            <div className="container mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center glow">
                            <Headphones className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold gradient-text">Bookify</span>
                    </Link>

                    <div className="hidden md:flex items-center gap-2">
                        {navItems.map((item) => (
                            <Link key={item.path} to={item.path}>
                                <Button
                                    variant={isActive(item.path) ? "default" : "ghost"}
                                    className={isActive(item.path) ? "glow" : ""}
                                >
                                    <item.icon className="w-4 h-4 mr-2" />
                                    {item.label}
                                </Button>
                            </Link>
                        ))}
                    </div>

                    {user ? (
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 text-orange-500 font-bold bg-orange-500/10 px-3 py-1 rounded-full animate-pulse-glow">
                                <Flame className="w-4 h-4 fill-orange-500" />
                                <span>{streak} Days</span>
                            </div>
                            <span className="font-medium">{user.full_name}</span>
                        </div>
                    ) : (
                        <Link to="/login">
                            <Button className="bg-gradient-to-r from-primary to-accent glow">
                                Get Started
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navigation;
