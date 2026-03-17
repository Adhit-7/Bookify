import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  onRatingChange?: (rating: number) => void;
  interactive?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const RatingStars = ({
  rating,
  maxRating = 5,
  onRatingChange,
  interactive = false,
  size = "md",
  className,
}: RatingStarsProps) => {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <div className={cn("flex gap-1", className)}>
      {Array.from({ length: maxRating }).map((_, i) => {
        const starRating = i + 1;
        const isActive = starRating <= rating;

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRatingChange?.(starRating)}
            className={cn(
              "transition-all duration-200",
              interactive ? "hover:scale-125 active:scale-95" : "cursor-default",
              isActive ? "text-yellow-400" : "text-muted-foreground/30",
              interactive && "hover:text-yellow-300"
            )}
          >
            <Star
              className={cn(sizes[size], isActive && "fill-current")}
              strokeWidth={isActive ? 1.5 : 1}
            />
          </button>
        );
      })}
    </div>
  );
};

export default RatingStars;
