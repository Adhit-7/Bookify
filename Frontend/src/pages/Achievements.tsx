import { useState, useEffect } from "react";
import api from "@/lib/api";
import Layout from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Trophy, Flame, BookOpen, Star, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";


const iconMap: any = {
  "Trophy": Trophy,
  "Flame": Flame,
  "BookOpen": BookOpen,
  "Star": Star,
  "User": User
};

const Achievements = () => {
  const [achievements, setAchievements] = useState<any[]>([]);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const res = await api.get("/users/me/achievements");
        setAchievements(res.data);
      } catch (error) {
        console.error("Failed to fetch achievements", error);
      }
    };
    fetchAchievements();
  }, []);

  return (
    <Layout>
      <section className="py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-2">
              Your <span className="text-gradient">Achievements</span>
            </h1>
            <p className="text-muted-foreground">
              Badges you've earned on your journey
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((ach, index) => {
              const Icon = iconMap[ach.icon] || Trophy;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-gradient-to-br from-card to-card-hover border-border/50 overflow-hidden hover:shadow-glow transition-all">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4 text-primary animate-pulse-glow">
                        <Icon className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">{ach.name}</h3>
                      <p className="text-muted-foreground">{ach.description}</p>
                      <span className="text-xs text-muted-foreground mt-4 block">
                        Earned on {new Date(ach.date).toLocaleDateString()}
                      </span>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}

            {achievements.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No achievements yet. Keep reading to earn batches!
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Achievements;
