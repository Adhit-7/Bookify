import { useState, useEffect } from "react";
import { 
  X, 
  User as UserIcon, 
  BookOpen, 
  MessageSquare, 
  UserMinus, 
  Calendar,
  History,
  Star,
  CheckCircle,
  Loader2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

interface Activity {
  book_id: number;
  book_title: str;
  type: string;
  rating?: number;
  comment?: string;
  timestamp: string;
}

interface UserProfile {
  id: number;
  username?: string;
  email: string;
  full_name?: string;
  profile_picture?: string;
  joined_at: string;
  books_finished: int;
  total_reviews: int;
  recent_activity: Activity[];
  is_friend: boolean;
  friendship_status: string;
}

interface UserProfileModalProps {
  userId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onUnfriend?: () => void;
}

const UserProfileModal = ({ userId, isOpen, onClose, onUnfriend }: UserProfileModalProps) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && userId) {
      fetchProfile();
    }
  }, [isOpen, userId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/social/profile/${userId}`);
      setProfile(response.data);
    } catch (error) {
      toast.error("Failed to load user profile");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleUnfriend = async () => {
    if (!profile) return;
    try {
      await api.delete(`/social/friends/${profile.id}`);
      toast.success("Unfriended successfully");
      if (onUnfriend) onUnfriend();
      onClose();
    } catch (error) {
      toast.error("Failed to unfriend");
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-card">
        {loading ? (
          <div className="h-[400px] flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        ) : profile ? (
          <div className="relative">
            {/* Header / Cover */}
            <div className="h-32 bg-gradient-to-r from-primary/30 via-primary/10 to-transparent relative">
              <div className="absolute -bottom-12 left-8">
                <div className="w-24 h-24 rounded-3xl bg-card border-4 border-card shadow-xl flex items-center justify-center overflow-hidden">
                  {profile.profile_picture ? (
                    <img 
                      src={`http://localhost:8000/${profile.profile_picture}`} 
                      className="w-full h-full object-cover"
                      alt={profile.full_name || profile.username}
                    />
                  ) : (
                    <UserIcon className="w-10 h-10 text-primary/40" />
                  )}
                </div>
              </div>
            </div>

            <div className="pt-16 px-8 pb-8 space-y-6">
              {/* Identity */}
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold uppercase tracking-tight">
                    {profile.full_name || profile.username || "Anonymous User"}
                  </h2>
                  {profile.is_friend && (
                    <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest rounded-full border border-primary/20">
                      Friend
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-sm">{profile.email}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  Joined {new Date(profile.joined_at).toLocaleDateString()}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary/10 p-4 rounded-2xl border border-border/50">
                  <div className="flex items-center gap-2 text-primary mb-1">
                    <BookOpen className="w-4 h-4" />
                    <span className="text-xl font-bold">{profile.books_finished}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Books Finished</p>
                </div>
                <div className="bg-secondary/10 p-4 rounded-2xl border border-border/50">
                  <div className="flex items-center gap-2 text-primary mb-1">
                    <Star className="w-4 h-4" />
                    <span className="text-xl font-bold">{profile.total_reviews}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Total Reviews</p>
                </div>
              </div>

              {/* Activity */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                  <History className="w-4 h-4" /> Recent Activity
                </h3>
                <div className="space-y-3 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                  {profile.recent_activity.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No recent activity found.</p>
                  ) : (
                    profile.recent_activity.map((act, i) => (
                      <div key={i} className="flex gap-3 group">
                        <div className="mt-1">
                          {act.type === "review" ? (
                            <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate group-hover:text-primary transition-colors">
                            {act.book_title}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {act.type === "review" ? `Rated ${act.rating}/5` : "Finished reading"} • {new Date(act.timestamp).toLocaleDateString()}
                          </p>
                          {act.comment && (
                            <p className="text-[10px] text-muted-foreground/60 italic mt-0.5 line-clamp-1">"{act.comment}"</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 flex gap-3">
                {profile.is_friend && (
                  <>
                    <Button variant="destructive" className="flex-1 rounded-xl gap-2 font-bold" onClick={handleUnfriend}>
                      <UserMinus className="w-4 h-4" /> Unfriend
                    </Button>
                    <Button variant="outline" className="flex-1 rounded-xl gap-2 font-bold" onClick={onClose}>
                      <MessageSquare className="w-4 h-4" /> Message
                    </Button>
                  </>
                )}
                {!profile.is_friend && profile.friendship_status === "none" && (
                  <Button className="w-full rounded-xl gap-2 font-bold">
                    <UserIcon className="w-4 h-4" /> Add Friend
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileModal;
