import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Send, Loader2, User, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import api from "@/lib/api";
import RatingStars from "./RatingStars";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface Review {
  id: number;
  rating: number;
  comment: string;
  username: string;
  created_at: string;
}

interface ReviewSectionProps {
  bookId: number;
}

const ReviewSection = ({ bookId }: ReviewSectionProps) => {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch reviews
  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: ["reviews", bookId],
    queryFn: async () => {
      const res = await api.get(`/reviews/book/${bookId}`);
      return res.data;
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["review-stats", bookId],
    queryFn: async () => {
      const res = await api.get(`/reviews/stats/${bookId}`);
      return res.data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a star rating");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/reviews/", {
        book_id: bookId,
        rating,
        comment,
      });
      toast.success("Review submitted! Thank you.");
      setRating(0);
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["reviews", bookId] });
      queryClient.invalidateQueries({ queryKey: ["review-stats", bookId] });
    } catch (error: any) {
      const message = error.response?.data?.detail || "Failed to submit review";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 mt-12 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            Community Reviews
          </h3>
          {stats && stats.total_reviews > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <RatingStars rating={stats.average_rating} size="sm" />
              <span className="text-sm text-muted-foreground font-medium">
                {stats.average_rating.toFixed(1)} avg rating • {stats.total_reviews} reviews
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Review Form */}
      <Card className="p-6 bg-secondary/20 border-border/50 rounded-2xl overflow-hidden relative">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Your Rating</label>
            <RatingStars rating={rating} onRatingChange={setRating} interactive size="lg" />
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Your Thoughts</label>
            <Textarea
              placeholder="What did you think of this book?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="bg-background/50 border-border/50 min-h-[100px] rounded-xl focus:ring-primary/20"
            />
          </div>

          <Button 
            disabled={isSubmitting} 
            className="w-full md:w-auto px-8 gap-2 rounded-xl shadow-lg shadow-primary/20"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Submit Review
          </Button>
        </form>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 px-6 bg-secondary/10 rounded-2xl border border-dashed border-border/50">
            <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground italic">No reviews yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {reviews.map((review) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-5 bg-card/40 border border-border/50 rounded-2xl space-y-3 relative overflow-hidden"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground leading-none">{review.username}</p>
                        <div className="flex items-center gap-2 mt-1 whitespace-nowrap">
                          <RatingStars rating={review.rating} size="sm" />
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase tracking-tighter">
                            <Clock className="w-2.5 h-2.5" />
                            {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-muted-foreground leading-relaxed pl-[52px]">
                      {review.comment}
                    </p>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

const Card = ({ children, className, ...props }: any) => (
  <div className={`bg-card text-card-foreground rounded-lg border shadow-sm ${className}`} {...props}>
    {children}
  </div>
);

export default ReviewSection;
