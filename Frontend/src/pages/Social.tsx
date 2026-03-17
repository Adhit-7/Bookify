import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  UserPlus, 
  Search, 
  Users, 
  Check, 
  X, 
  User as UserIcon, 
  Loader2,
  Bell,
  CheckCircle2
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import api from "@/lib/api";
import UserProfileModal from "@/components/social/UserProfileModal";

interface User {
  id: number;
  username?: string;
  email: string;
  full_name?: string;
  profile_picture?: string;
}

interface FriendshipRequest {
  id: number;
  user_id: number;
  friend_id: number;
  status: string;
  friend_info?: User;
}

const SocialPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [friends, setFriends] = useState<User[]>([]);
  const [requests, setRequests] = useState<FriendshipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const fetchSocialData = async () => {
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        api.get("/social/friends"),
        api.get("/social/requests")
      ]);
      setFriends(friendsRes.data);
      setRequests(requestsRes.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load social data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSocialData();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.length < 2) return;
    
    setIsSearching(true);
    try {
      const res = await api.get(`/social/search?q=${searchQuery}`);
      setSearchResults(res.data);
    } catch (error) {
      toast.error("Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  const sendRequest = async (userId: number) => {
    try {
      await api.post(`/social/request/${userId}`);
      toast.success("Friend request sent!");
    } catch (error) {
      toast.error("Already sent or failed");
    }
  };

  const acceptRequest = async (requestId: number) => {
    try {
      await api.post(`/social/accept/${requestId}`);
      toast.success("Friend request accepted!");
      fetchSocialData();
    } catch (error) {
      toast.error("Failed to accept");
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight">Community</h1>
          <p className="text-muted-foreground mt-2 text-lg">Find friends and see what they are reading.</p>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Tabs defaultValue="friends" className="w-full">
              <TabsList className="bg-secondary/20 p-1 rounded-xl mb-6">
                <TabsTrigger value="friends" className="rounded-lg px-8 py-2">Friends ({friends.length})</TabsTrigger>
                <TabsTrigger value="requests" className="relative rounded-lg px-8 py-2">
                  Requests
                  {requests.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-background animate-pulse">
                      {requests.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="friends">
                {loading ? (
                  <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary/50" /></div>
                ) : friends.length === 0 ? (
                  <Card className="bg-secondary/5 border-dashed border-2 py-16 text-center">
                    <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/20" />
                    <h3 className="text-xl font-semibold">No friends yet</h3>
                    <p className="text-muted-foreground mt-1">Start searching to connecting with other readers!</p>
                  </Card>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {friends.map((friend) => (
                      <Card 
                        key={friend.id} 
                        className="overflow-hidden border-border/50 bg-secondary/10 hover:bg-secondary/20 transition-all group cursor-pointer"
                        onClick={() => {
                          setSelectedUserId(friend.id);
                          setIsProfileOpen(true);
                        }}
                      >
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/30 text-primary">
                            {friend.profile_picture ? (
                              <img src={`http://localhost:8000/${friend.profile_picture}`} className="w-full h-full object-cover rounded-full" />
                            ) : <UserIcon className="w-7 h-7" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-lg truncate">{friend.full_name || friend.username || friend.email}</h4>
                            <p className="text-sm text-muted-foreground truncate">{friend.email}</p>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/20">
                              <UserIcon className="w-5 h-5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="requests">
                <div className="space-y-4">
                  {requests.length === 0 ? (
                    <Card className="bg-secondary/5 border-dashed border-2 py-16 text-center">
                      <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground/20" />
                      <h3 className="text-xl font-semibold">No pending requests</h3>
                    </Card>
                  ) : (
                    requests.map((req) => (
                      <Card key={req.id} className="border-border/50 bg-secondary/10 hover:bg-secondary/20 transition-all">
                        <CardContent className="p-6 flex items-center gap-6">
                          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/30 text-primary">
                            <UserIcon className="w-8 h-8" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-xl">{req.friend_info?.full_name || req.friend_info?.username || req.friend_info?.email}</h4>
                            <p className="text-muted-foreground">wants to connect with you</p>
                          </div>
                          <div className="flex gap-3">
                            <Button onClick={() => acceptRequest(req.id)} className="rounded-xl gap-2 font-bold px-6">
                              <Check className="w-5 h-5" /> Accept
                            </Button>
                            <Button variant="outline" className="rounded-xl gap-2 font-bold px-6 hover:bg-destructive/10 hover:text-destructive">
                              <X className="w-5 h-5" /> Decline
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card className="border-border/50 shadow-2xl glass overflow-hidden">
              <CardHeader className="bg-primary/10 pb-6">
                <CardTitle className="flex items-center gap-3">
                  <Search className="w-6 h-6 text-primary" />
                  Find Readers
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-8">
                <form onSubmit={handleSearch} className="flex gap-3 mb-8">
                  <Input 
                    placeholder="Username or email..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rounded-xl bg-secondary/20 border-border/50 h-12"
                  />
                  <Button type="submit" size="icon" className="shrink-0 rounded-xl h-12 w-12" disabled={isSearching}>
                    {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  </Button>
                </form>

                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {searchResults.map((user) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex items-center gap-4 p-4 rounded-2xl border border-border/50 bg-secondary/5 hover:bg-secondary/15 transition-all"
                      >
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden">
                          {user.profile_picture ? (
                             <img src={`http://localhost:8000/${user.profile_picture}`} className="w-full h-full object-cover" />
                          ) : (
                            user.email.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate">{user.username || user.email}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.full_name}</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="rounded-xl text-primary hover:bg-primary/20"
                          onClick={() => sendRequest(user.id)}
                        >
                          <UserPlus className="w-5 h-5" />
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {searchResults.length === 0 && searchQuery.length >= 2 && !isSearching && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground italic">No readers found with that name.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <UserProfileModal 
        userId={selectedUserId} 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        onUnfriend={fetchSocialData}
      />
    </Layout>
  );
};

export default SocialPage;
