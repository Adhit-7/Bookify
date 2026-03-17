import { motion } from "framer-motion";
import { Library as LibraryIcon, Mic2, Headphones, Trophy } from "lucide-react";

const steps = [
  {
    icon: LibraryIcon,
    title: "Browse the Library",
    description: "Explore our curated collection of books, all ready to be transformed into audiobooks.",
    step: "01",
  },
  {
    icon: Mic2,
    title: "Choose AI Voice",
    description: "Select from three unique AI-generated voices that suit your preference.",
    step: "02",
  },
  {
    icon: Headphones,
    title: "Start Listening",
    description: "Enjoy your audiobook with real-time text highlighting and playback controls.",
    step: "03",
  },
  {
    icon: Trophy,
    title: "Earn Rewards",
    description: "Build streaks, complete books, and earn achievements along the way.",
    step: "04",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {}
      <div className="absolute inset-0 gradient-accent opacity-50" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            How <span className="text-gradient">Bookify</span> Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get started in minutes and transform any book into an engaging audio experience.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="relative text-center group"
            >
              {}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[60%] w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
              )}

              {}
              <div className="relative inline-block mb-6">
                <div className="h-24 w-24 rounded-2xl gradient-button flex items-center justify-center mx-auto group-hover:shadow-glow transition-shadow">
                  <step.icon className="h-10 w-10 text-primary-foreground" />
                </div>
                <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">{step.step}</span>
                </div>
              </div>

              <h3 className="font-heading text-xl font-semibold text-foreground mb-3">
                {step.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
