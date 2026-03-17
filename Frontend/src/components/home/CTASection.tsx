import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  const [isAuthenticated] = useState(() => !!localStorage.getItem("token"));

  
  if (isAuthenticated) return null;

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 gradient-hero" />

      {}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-accent/20 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >

          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-6">
            Ready to Transform Your{" "}
            <span className="text-gradient">Reading Experience?</span>
          </h2>

          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of readers who have already discovered the power of AI-powered audiobooks.
            Start listening for free today.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button variant="hero" size="xl">
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>

          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
