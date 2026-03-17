import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Clock, BookOpen, Star, Share2, Heart, MessageSquare, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import api from "@/lib/api";
import BookCard from "./BookCard";
import EsewaPaymentModal from "./EsewaPaymentModal";
import { useNavigate } from "react-router-dom";

interface BookDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: number;
}

const BookDetailModal = ({ isOpen, onClose, bookId }: BookDetailModalProps) => {
  const [book, setBook] = useState<any>(null);
  const [summary, setSummary] = useState("");
  const [similarBooks, setSimilarBooks] = useState<any[]>([]);
  const [isPurchased, setIsPurchased] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && bookId) {
      fetchBookDetails();
    }
  }, [isOpen, bookId]);

  const fetchBookDetails = async () => {
    setLoading(true);
    try {
      const [bookRes, summaryRes, similarRes, statusRes] = await Promise.all([
        api.get(`/books/${bookId}`),
        api.get(`/books/${bookId}/summary`),
        api.get(`/books/${bookId}/similar`),
        api.get(`/payments/status/${bookId}`)
      ]);

      const mappedBook = {
        id: bookRes.data.id,
        title: bookRes.data.title,
        author: bookRes.data.author,
        cover: bookRes.data.cover_image
          ? `http://localhost:8000/${bookRes.data.cover_image}`
          : "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800",
        genre: bookRes.data.genre || "Unknown",
        description: bookRes.data.description || "No description available."
      };

      setBook(mappedBook);
      setSummary(summaryRes.data.summary);
      setSimilarBooks(similarRes.data.map((b: any) => ({
        id: b.id,
        title: b.title,
        author: b.author,
        cover: b.cover_image ? `http://localhost:8000/${b.cover_image}` : "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800",
        category: b.genre || "Unknown",
        duration: "10m"
      })));
      setIsPurchased(statusRes.data.purchased);
    } catch (error) {
      console.error("Failed to fetch book details", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleAction = () => {
    if (isPurchased) {
      navigate(`/player/${bookId}`);
      onClose();
    } else {
      setShowPayment(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-5xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden my-8"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 p-2 bg-background/50 hover:bg-background/80 rounded-full text-foreground transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {loading ? (
          <div className="h-[600px] flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        ) : book && (
          <div className="flex flex-col md:flex-row">
            {/* Left: Cover & Action */}
            <div className="md:w-1/3 p-8 bg-secondary/30">
              <div className="sticky top-8">
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl mb-8 group"
                >
                  <img src={book.cover} alt={book.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                    <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-md">
                      {book.genre}
                    </Badge>
                  </div>
                </motion.div>

                <Button
                  size="lg"
                  className="w-full h-14 text-lg font-bold shadow-glow hover:shadow-glow-lg transition-all"
                  onClick={handleAction}
                >
                  {isPurchased ? (
                    <><Play className="mr-2 h-5 w-5 fill-current" /> Listen Now</>
                  ) : (
                    <>Purchase & Listen — Rs. 99</>
                  )}
                </Button>

                <div className="mt-6 grid grid-cols-4 gap-2">
                  <Button variant="outline" size="icon" className="rounded-xl"><Heart className="w-4 h-4" /></Button>
                  <Button variant="outline" size="icon" className="rounded-xl"><Share2 className="w-4 h-4" /></Button>
                  <Button variant="outline" size="icon" className="rounded-xl"><MessageSquare className="w-4 h-4" /></Button>
                  <Button variant="outline" size="icon" className="rounded-xl"><Star className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>

            {/* Right: Content */}
            <div className="md:w-2/3 p-8 md:p-12 space-y-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div>
                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4"
                >
                  {book.title}
                </motion.h1>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-xl text-muted-foreground"
                >
                  by <span className="text-primary font-semibold">{book.author}</span>
                </motion.p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Duration</p>
                  <div className="flex items-center gap-2 font-semibold">
                    <Clock className="w-4 h-4 text-primary" /> 10m
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Format</p>
                  <div className="flex items-center gap-2 font-semibold">
                    <BookOpen className="w-4 h-4 text-primary" /> Audiobook
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Language</p>
                  <p className="font-semibold">English</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Released</p>
                  <p className="font-semibold">2024</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  AI <span className="text-gradient">Summary</span>
                </h3>
                <div className="p-6 bg-secondary/50 rounded-2xl border border-border/50 text-foreground/90 leading-relaxed italic relative">
                  <span className="absolute -top-4 -left-2 text-6xl text-primary/10 font-serif">"</span>
                  {summary || "AI is generating a summary..."}
                </div>
              </div>

              {similarBooks.length > 0 && (
                <div className="space-y-6 pt-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-bold">Similar <span className="text-gradient">Books</span></h3>
                    <Button variant="ghost" size="sm" className="group">
                      View all <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin">
                    {similarBooks.map((sBook) => (
                      <div key={sBook.id} className="min-w-[160px] w-[160px]">
                        <BookCard
                          {...sBook}
                          variant="compact"
                          onClick={() => {
                            // Recursively open details for the similar book
                            navigate(`/library?book=${sBook.id}`);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {book && (
        <EsewaPaymentModal
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          book={book}
          onSuccess={() => {
            setIsPurchased(true);
            toast.success("Purchase successful! You can now listen to this book.");
          }}
        />
      )}
    </div>
  );
};

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
);

export default BookDetailModal;
