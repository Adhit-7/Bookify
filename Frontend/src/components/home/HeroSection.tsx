import { Link } from "react-router-dom";
import { Play, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBook from "@/assets/hero-book.png";
import { useState, useEffect } from "react";
import api from "@/lib/api";

const HeroSection = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem("token"));
    const [userProfile, setUserProfile] = useState<any>(null);
    const [nowPlaying, setNowPlaying] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setLoading(false);
                return;
            }

            setIsAuthenticated(true);

            try {
                
                const profileRes = await api.get("/users/me");
                setUserProfile(profileRes.data);
                console.log("User profile:", profileRes.data);

                
                const nowPlayingRes = await api.get("/books/now-playing");
                console.log("Now playing response:", nowPlayingRes.data);
                setNowPlaying(nowPlayingRes.data);
            } catch (error) {
                console.error("Failed to fetch user data:", error);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    
    const heroImage = nowPlaying?.cover_image
        ? `http://localhost:8000/${nowPlaying.cover_image}`
        : heroBook;
    const currentStreak = userProfile?.current_streak || 0;
    const nowPlayingTitle = nowPlaying?.title || "Start Your Journey";

    return (
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden gradient-hero">
            <div className="container mx-auto px-4 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {}
                    <div className="text-center lg:text-left">



                        <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
                            Listen to Your Books with{" "}
                            <span className="text-gradient">AI Voices</span>
                        </h1>

                        <p className="text-base md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">
                            Browse our library, pick a voice, and listen. Track your progress with streaks and test yourself with quizzes.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            {!isAuthenticated ? (
                                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                    <Link to="/signup">
                                        <Button
                                            size="lg"
                                            variant="hero"
                                            className="gap-2 text-base px-8 py-6 h-auto shadow-glow hover:scale-105 transition-transform"
                                        >
                                            Browse Library
                                        </Button>
                                    </Link>
                                    <Link to="/signup">
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            className="gap-2 text-base px-8 py-6 h-auto"
                                        >
                                            Get Started Free
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <Link to="/library">
                                    <Button variant="hero" size="xl" className="w-full sm:w-auto hover-lift">
                                        <Headphones className="h-5 w-5" />
                                        Go to Library
                                    </Button>
                                </Link>
                            )}
                        </div>

                        {}
                        <div className="flex gap-8 mt-12 justify-center lg:justify-start">
                            {[
                                { value: "Unlimited", label: "Uploads" },
                                { value: "3", label: "Neural Voices" },
                                { value: "Smart", label: "Tracking" },
                            ].map((stat, index) => (
                                <div key={index} className="text-center">
                                    <div className="text-2xl md:text-3xl font-bold text-gradient">{stat.value}</div>
                                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {}
                    <div className="relative hidden lg:block">
                        <div className="relative max-w-[80%] mx-auto">
                            <img
                                src={heroImage}
                                alt="AI-powered audiobook experience"
                                className="w-full h-auto rounded-2xl shadow-card"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent rounded-2xl" />
                        </div>

                        {}


                        {}
                        {isAuthenticated && !loading && currentStreak > 0 && (
                            <div className="absolute -bottom-4 -left-4 glass rounded-xl p-4 shadow-card" style={{ backgroundColor: 'hsl(45 93% 58%)', borderColor: 'hsl(45 93% 58%)' }}>
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl">🔥</div>
                                    <div>
                                        <div className="text-sm font-medium" style={{ color: 'hsl(0 0% 10%)' }}>
                                            {currentStreak} Day Streak!
                                        </div>
                                        <div className="text-xs" style={{ color: 'hsl(0 0% 20%)' }}>Keep it going</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
