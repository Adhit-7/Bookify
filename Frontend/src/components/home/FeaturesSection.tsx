import { motion } from "framer-motion";
import {
  Library as LibraryIcon,
  Mic2,
  Type,
  Bookmark,
  Flame,
  Trophy,
  Brain,
  Sparkles
} from "lucide-react";

const features = [
  {
    icon: LibraryIcon,
    title: "Browse Curated Library",
    description: "Explore our growing library of audiobooks, carefully curated and ready to listen to with AI voices.",
  },
  {
    icon: Mic2,
    title: "3 AI Voice Options",
    description: "Choose from three distinct AI-generated voices to personalize your listening experience.",
  },
  {
    icon: Type,
    title: "Real-time Highlighting",
    description: "Follow along with synchronized text highlighting as you listen to your books.",
  },
  {
    icon: Bookmark,
    title: "Smart Bookmarks",
    description: "Save your place and resume exactly where you left off across all your devices.",
  },
  {
    icon: Flame,
    title: "Listening Streaks",
    description: "Build daily habits with streak tracking. Listen for 5+ minutes to keep your streak alive.",
  },
  {
    icon: Trophy,
    title: "Achievements",
    description: "Earn rewards and unlock achievements as you complete books and maintain streaks.",
  },
  {
    icon: Brain,
    title: "AI-Generated Quizzes",
    description: "Test your understanding with automatically generated quizzes from your book content.",
  },
  {
    icon: Sparkles,
    title: "Smart Recommendations",
    description: "Discover new books based on your reading history and preferences.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-card/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need to{" "}
            <span className="text-gradient">Listen & Learn</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Bookify combines cutting-edge AI technology with thoughtful design to create
            the ultimate audiobook experience.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group gradient-card rounded-xl p-6 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-glow"
            >
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
