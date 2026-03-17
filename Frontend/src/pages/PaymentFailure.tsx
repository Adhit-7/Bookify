import { useNavigate } from "react-router-dom";
import { XCircle, AlertCircle, Library, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const PaymentFailure = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-card border border-border rounded-3xl p-8 text-center space-y-8 shadow-2xl"
      >
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
              <XCircle className="w-12 h-12 text-destructive" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Payment Cancelled</h2>
            <p className="text-muted-foreground">The transaction was cancelled or failed. Your account has not been charged.</p>
          </div>
          
          <div className="p-4 bg-secondary/50 rounded-2xl flex gap-3 text-left">
            <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Common reasons for failure include insufficient balance, network issues at eSewa, or manual cancellation. Please try again.
            </p>
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <Button onClick={() => navigate("/library")} className="h-12 text-lg font-bold rounded-xl gap-2">
              <RotateCcw className="w-5 h-5" /> Try Again
            </Button>
            <Button variant="ghost" onClick={() => navigate("/library")} className="h-12 rounded-xl text-muted-foreground">
               Go to Library
            </Button>
          </div>
        </div>

        <div className="flex justify-center items-center gap-2 pt-4 border-t border-border/10 text-[10px] uppercase tracking-widest text-muted-foreground opacity-50 font-bold">
          <AlertCircle className="w-3 h-3" /> Payment failure notice
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentFailure;
