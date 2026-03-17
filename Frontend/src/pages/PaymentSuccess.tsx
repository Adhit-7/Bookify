import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, ShieldCheck, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { toast } from "sonner";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"verifying" | "regenerating" | "success" | "error">("verifying");
  const [message, setMessage] = useState("Verifying your payment...");
  const [bookId, setBookId] = useState<number | null>(null);

  useEffect(() => {
    const processPayment = async () => {
      const data = searchParams.get("data");
      if (!data) {
        setStatus("error");
        setMessage("No payment data received from eSewa.");
        return;
      }

      try {
        // Step 1: Verify payment with backend
        setStatus("verifying");
        setMessage("Verifying your payment with eSewa...");
        const verifyRes = await api.post("/payments/verify", { data });
        const bid: number = verifyRes.data.book_id;
        setBookId(bid);

        // Step 2: Trigger full audio regeneration for the purchased book
        setStatus("regenerating");
        setMessage("Unlocking full book content...");
        const voice = localStorage.getItem("preferredVoice") || "voice1";

        try {
          // This call regenerates the full audio since the user is now marked as purchased
          await api.post(`/books/${bid}/audio`, { voice });
        } catch (e) {
          console.warn("Audio regeneration failed, user can retry from player:", e);
        }

        setStatus("success");
        setMessage("Your book is fully unlocked!");
        toast.success("🎉 Payment verified! Full content unlocked.");
      } catch (error: any) {
        setStatus("error");
        const detail = error?.response?.data?.detail || "Verification failed. Please contact support.";
        setMessage(detail);
        toast.error(`Payment verification failed: ${detail}`);
      }
    };

    processPayment();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-card border border-border rounded-3xl p-8 text-center space-y-8 shadow-2xl"
      >
        {/* Verifying */}
        {(status === "verifying" || status === "regenerating") && (
          <div className="space-y-6 py-10">
            <div className="relative flex justify-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">
                {status === "verifying" ? "Verifying Payment" : "Unlocking Content"}
              </h2>
              <p className="text-muted-foreground">{message}</p>
              {status === "regenerating" && (
                <div className="mt-4 flex gap-1 justify-center">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-primary rounded-full"
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success */}
        {status === "success" && (
          <div className="space-y-6">
            <div className="relative flex justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="w-24 h-24 bg-[#41a124]/20 rounded-full flex items-center justify-center"
              >
                <CheckCircle2 className="w-14 h-14 text-[#41a124]" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1.4 }}
                transition={{ duration: 1.2, repeat: Infinity, repeatType: "reverse" }}
                className="absolute inset-0 bg-[#41a124]/10 rounded-full blur-2xl -z-10"
              />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">Payment Successful!</h2>
              <p className="text-muted-foreground">{message}</p>
            </div>

            {/* eSewa branding */}
            <div className="flex items-center justify-center gap-2 py-3 px-4 bg-[#41a124]/10 rounded-2xl border border-[#41a124]/20">
              <span className="w-7 h-7 bg-[#41a124] rounded flex items-center justify-center text-white font-black text-sm italic">e</span>
              <span className="text-sm font-semibold text-[#41a124]">Paid via eSewa</span>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              {bookId && (
                <Button
                  onClick={() => navigate(`/player/${bookId}`)}
                  className="h-13 text-lg font-bold rounded-xl gap-2 py-3 bg-[#41a124] hover:bg-[#369d1e] text-white"
                >
                  <BookOpen className="w-5 h-5" /> Listen Now
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => navigate("/library")}
                className="h-12 rounded-xl"
              >
                Go to Library
              </Button>
            </div>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-destructive/20 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-destructive" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-destructive">Verification Failed</h2>
              <p className="text-muted-foreground text-sm">{message}</p>
            </div>
            <div className="pt-4 flex flex-col gap-3">
              <Button variant="outline" onClick={() => navigate("/library")} className="h-12 rounded-xl">
                Back to Library
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-center items-center gap-2 pt-4 border-t border-border/10 text-[10px] uppercase tracking-widest text-muted-foreground opacity-50 font-bold">
          <ShieldCheck className="w-3 h-3" /> Secured by eSewa
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
