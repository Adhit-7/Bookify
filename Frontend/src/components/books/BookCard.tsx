import { motion } from "framer-motion";
import { Play, Clock, BookOpen, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BookCardProps {
  id: string;
  title: string;
  author: string;
  cover: string;
  duration: string;
  progress?: number;
  onClick?: () => void;
  onDelete?: (e: React.MouseEvent) => void;
  onReadMore?: () => void;
  className?: string;
  variant?: "default" | "compact";
}

const BookCard = ({ title, author, cover, duration, progress = 0, onClick, onDelete, onReadMore, className = "", variant = "default" }: BookCardProps) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      
      
      className={`group gradient-card rounded-xl overflow-hidden border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-glow relative ${className}`}
    >
      {}
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={cover}
          alt={`${title} book cover`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />

        {}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="hero"
            size="icon"
            className="h-14 w-14 rounded-full animate-pulse-glow"
            onClick={onClick}
          >
            <Play className="h-6 w-6" />
          </Button>
        </div>

        {}
        {onDelete && (
          <button
            onClick={onDelete}
            className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
          >
            <Trash className="h-4 w-4" />
          </button>
        )}

        {}
        {progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {}
      {variant === "default" ? (
        <div className="p-4">
          <h3 className="font-heading font-semibold text-foreground line-clamp-1 mb-1">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground mb-3">{author}</p>

          <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{duration}</span>
            </div>
            {progress > 0 && (
              <div className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                <span>{progress}% complete</span>
              </div>
            )}
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-xs hover:bg-primary hover:text-primary-foreground transition-all"
            onClick={(e) => {
              e.stopPropagation();
              onReadMore?.();
            }}
          >
            Read More
          </Button>
        </div>
      ) : (
        
        
        
        
        <div className="p-2 bg-background/50 backdrop-blur-sm absolute bottom-0 left-0 right-0">
          <h3 className="font-heading text-xs font-semibold text-foreground line-clamp-1 text-center">
            {title}
          </h3>
        </div>
      )}
    </motion.div>
  );
};

export default BookCard;
