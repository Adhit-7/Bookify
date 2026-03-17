import { motion } from "framer-motion";
import {
  User,
  Mail,
  Calendar,
  Flame,
  BookOpen,
  Clock,
  Edit2,
  Trophy,
  Star,
  Camera
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import api from "@/lib/api";


const iconMap: any = {
  "Trophy": Trophy,
  "Flame": Flame,
  "BookOpen": BookOpen,
  "Headphones": Clock,
  "Globe": Star,
  "Star": Star,
  "User": User
};

const Profile = () => {
  const navigate = useNavigate();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [profileData, setProfileData] = useState({
    name: "",
    username: "",
    email: "",
    bio: "",
    joinedDate: "",
    profilePicture: null as string | null, 
  });

  
  const [editForm, setEditForm] = useState({
    full_name: "",
    username: "",
    bio: ""
  });

  const [stats, setStats] = useState({
    currentStreak: 0,
    bestStreak: 0,
    booksRead: 0,
    totalListening: "0h 0m",
    achievements: 0,
    recentAchievements: [] as any[]
  });

  const fetchData = async () => {
    try {
      const [userRes, statsRes] = await Promise.all([
        api.get("/users/me"),
        api.get("/users/me/stats")
      ]);

      const user = userRes.data;
      
      const displayUsername = user.username || user.email.split('@')[0];

      setProfileData({
        name: user.full_name || displayUsername,
        username: displayUsername,
        email: user.email,
        bio: user.bio || "",
        joinedDate: new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        profilePicture: user.profile_picture ? `http://localhost:8000/${user.profile_picture}` : null
      });

      
      setEditForm({
        full_name: user.full_name || "",
        username: user.username || displayUsername,
        bio: user.bio || ""
      });

      setStats(statsRes.data);
      setLoading(false);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load profile data");
    }
  };

  useEffect(() => {
    fetchData();

    
    const handleFocus = () => fetchData();
    window.addEventListener('focus', handleFocus);

    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleSaveProfile = async () => {
    try {
      await api.put("/users/me", editForm);
      toast.success("Profile updated successfully!");
      setIsEditDialogOpen(false);
      fetchData(); 
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to update profile");
    }
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append("file", file);

      try {
        await api.post("/users/me/avatar", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success("Profile picture updated!");
        fetchData(); 
      } catch (error) {
        console.error(error);
        toast.error("Failed to upload image");
      }
    }
  };

  if (loading) return (
    <Layout>
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-1"
            >
              <div className="gradient-card rounded-xl p-8 border border-border/50 text-center sticky top-24">
                {}
                <div className="relative inline-block mb-6 group">
                  <div className="h-32 w-32 rounded-full gradient-button flex items-center justify-center mx-auto shadow-2xl shadow-primary/20 overflow-hidden relative">
                    {profileData.profilePicture ? (
                      <img src={profileData.profilePicture} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-16 w-16 text-primary-foreground" />
                    )}

                    {}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                      <Camera className="h-8 w-8 text-white pointer-events-none" />
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        onChange={handleProfilePictureUpload}
                      />
                    </div>
                  </div>
                </div>

                {}
                <h1 className="font-heading text-2xl font-bold text-foreground mb-1">
                  {profileData.name}
                </h1>
                <p className="text-primary font-medium mb-4">{profileData.email}</p>

                {profileData.bio && (
                  <div className="text-sm text-muted-foreground mb-6 italic px-4">
                    "{profileData.bio}"
                  </div>
                )}



                {}
                <div className="space-y-3">
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full border-primary/20 hover:bg-primary/10 hover:text-primary transition-all">
                        Edit Profile
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            value={editForm.full_name}
                            onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea
                            id="bio"
                            value={editForm.bio}
                            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                            placeholder="Tell us a bit about yourself..."
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveProfile}>Save Changes</Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="destructive"
                    className="w-full bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
                    onClick={() => {
                      localStorage.clear();
                      navigate("/");
                      toast.success("Logged out successfully");
                    }}
                  >
                    Logout
                  </Button>
                </div>
              </div>
            </motion.div>

            {}
            <div className="lg:col-span-2 space-y-8">
              {}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                {[
                  { icon: BookOpen, value: stats.booksRead, label: "Books Completed", color: "text-blue-400" },
                  { icon: Clock, value: stats.totalListening, label: "Total Listening", color: "text-purple-400" },
                  { icon: Flame, value: stats.currentStreak, label: "Day Streak", color: "text-orange-400" },
                ].map((stat, index) => (
                  <div
                    key={stat.label}
                    className="gradient-card rounded-xl p-6 text-center border border-border/50 hover:border-primary/30 transition-all hover:scale-[1.02]"
                  >
                    <div className={`h-12 w-12 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-3 ${stat.color}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</div>
                  </div>
                ))}
              </motion.div>

              {}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-heading text-xl font-semibold text-foreground">
                    Recent Achievements
                  </h2>
                  <Button variant="link" className="text-primary" onClick={() => navigate('/achievements')}>
                    View All
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {stats.recentAchievements.length > 0 ? (
                    stats.recentAchievements.map((ach, index) => {
                      const Icon = iconMap[ach.icon] || Trophy;
                      return (
                        <div key={index} className="flex items-center gap-4 p-4 rounded-xl border border-border/40 bg-card/30 hover:bg-card/50 transition-colors">
                          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <Icon className="h-7 w-7" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-foreground">{ach.name}</h3>
                            <p className="text-sm text-muted-foreground truncate">{ach.description}</p>
                          </div>
                          <div className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(ach.date).toLocaleDateString()}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground border border-dashed border-border/50 rounded-xl">
                      <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No achievements earned yet. Start listening!</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section >
    </Layout >
  );
};

export default Profile;
