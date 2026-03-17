import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageCircle, 
  Send, 
  X, 
  Minimize2, 
  ChevronLeft,
  User as UserIcon,
  Circle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import UserProfileModal from "./UserProfileModal";

interface User {
  id: number;
  username?: string;
  email: string;
  full_name?: string;
  profile_picture?: string;
}

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  is_read: boolean;
  created_at: string;
}

const ChatWidget = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [isOpen, setIsOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<User | null>(null);
  const [friends, setFriends] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem("token"));
    };
    window.addEventListener("storage", handleStorageChange);
    
    // Also check on mount in case it changed
    setToken(localStorage.getItem("token"));

    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    if (isOpen && token) {
      fetchFriends();
    }
  }, [isOpen, token]);

  if (!token) return null;

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat.id);
      const interval = setInterval(() => fetchMessages(activeChat.id), 3000);
      return () => clearInterval(interval);
    }
  }, [activeChat]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchFriends = async () => {
    try {
      const res = await api.get("/social/friends");
      setFriends(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMessages = async (friendId: number) => {
    try {
      const res = await api.get(`/social/chat/${friendId}`);
      setMessages(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    try {
      const res = await api.post("/social/chat/send", {
        receiver_id: activeChat.id,
        content: newMessage
      });
      setMessages([...messages, res.data]);
      setNewMessage("");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
    <div className="fixed bottom-6 right-6 z-[999]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-4 w-[380px] h-[500px] bg-card border border-border/50 shadow-2xl rounded-3xl flex flex-col overflow-hidden glass"
          >
            {/* Header */}
            <div className="p-4 border-b border-border/50 bg-primary/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {activeChat && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setActiveChat(null)}>
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                )}
                
                {activeChat ? (
                  <button 
                    onClick={() => setIsProfileOpen(true)}
                    className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary overflow-hidden">
                      {activeChat.profile_picture ? (
                        <img src={`http://localhost:8000/${activeChat.profile_picture}`} className="w-full h-full object-cover" />
                      ) : <UserIcon className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm leading-tight uppercase tracking-tight">{activeChat.full_name || activeChat.username}</h3>
                      <div className="flex items-center gap-1.5 ">
                        <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Online</span>
                      </div>
                    </div>
                  </button>
                ) : (
                  <div className="flex flex-col">
                    <h3 className="font-bold text-sm tracking-widest uppercase">Messages</h3>
                    <p className="text-[10px] text-muted-foreground font-bold">Your Connections</p>
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsOpen(false)}>
                  <Minimize2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative">
              <AnimatePresence mode="wait">
                {!activeChat ? (
                  /* Friend List */
                  <motion.div
                    key="list"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="h-full overflow-y-auto p-2 space-y-1 custom-scrollbar"
                  >
                    {friends.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
                        <MessageCircle className="w-12 h-12 mb-4" />
                        <p className="text-sm">No friends to chat with yet. Go connect on the Social page!</p>
                      </div>
                    ) : (
                      friends.map((friend: User) => (
                        <button
                          key={friend.id}
                          onClick={() => setActiveChat(friend)}
                          className="w-full p-3 flex items-center gap-4 rounded-2xl hover:bg-secondary/20 transition-all text-left group"
                        >
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                              {friend.profile_picture ? (
                                <img src={`http://localhost:8000/${friend.profile_picture}`} className="w-full h-full object-cover rounded-full" />
                              ) : <UserIcon className="w-6 h-6" />}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-card rounded-full" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate uppercase tracking-tight">{friend.full_name || friend.username}</p>
                            <p className="text-xs text-muted-foreground truncate italic">Tap to open chat</p>
                          </div>
                        </button>
                      ))
                    )}
                  </motion.div>
                ) : (
                  /* Chat Window */
                  <motion.div
                    key="chat"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 20, opacity: 0 }}
                    className="h-full flex flex-col bg-secondary/5"
                  >
                    <div 
                      ref={scrollRef}
                      className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar"
                    >
                      {messages.map((msg: Message) => {
                        const isMe = msg.receiver_id === activeChat.id;
                        return (
                          <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                            <div className={cn(
                              "max-w-[80%] p-3 rounded-2xl text-sm shadow-sm",
                              isMe 
                                ? "bg-primary text-primary-foreground rounded-tr-none" 
                                : "bg-card border border-border/50 rounded-tl-none"
                            )}>
                              {msg.content}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-border/50 bg-background/50 flex gap-2">
                      <Input 
                        placeholder="Type a message..."
                        className="rounded-2xl bg-secondary/20 border-border/50 focus:ring-primary/20 h-10 text-sm"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                      />
                      <Button size="icon" className="rounded-2xl h-10 w-10 shrink-0 shadow-lg shadow-primary/20">
                        <Send className="w-4 h-4" />
                      </Button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl transition-all glow duration-500",
          isOpen ? "bg-card rotate-90 border border-border/50" : "bg-primary text-primary-foreground"
        )}
      >
        {isOpen ? <X className="w-7 h-7" /> : <MessageCircle className="w-8 h-8" />}
        {!isOpen && friends.length > 0 && (
           <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white rounded-full flex items-center justify-center text-[10px] border-2 border-background animate-pulse">
                {friends.length}
           </div>
        )}
      </motion.button>
    </div>

    <UserProfileModal 
      userId={activeChat?.id || null} 
      isOpen={isProfileOpen} 
      onClose={() => setIsProfileOpen(false)}
      onUnfriend={() => {
        setActiveChat(null);
        fetchFriends();
      }}
    />
    </>
  );
};

export default ChatWidget;
