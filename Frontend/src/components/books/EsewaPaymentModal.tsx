import { useState } from "react";
import { motion } from "framer-motion";
import { X, Loader2, ShieldCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/lib/api";

// eSewa Developer Sandbox endpoint
const ESEWA_PAYMENT_URL = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";

interface EsewaPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: {
    id: number;
    title: string;
    author: string;
    cover: string;
  };
  onSuccess: () => void;
}

const EsewaPaymentModal = ({ isOpen, onClose, book }: EsewaPaymentModalProps) => {
  const [loading, setLoading] = useState(false);
  const amount = 99;

  const handlePay = async () => {
    setLoading(true);
    try {
      // Step 1: Call backend to create payment record & get HMAC signature
      const response = await api.post("/payments/initiate", {
        book_id: book.id,
        amount,
      });

      const { transaction_uuid, total_amount, product_code, signature, signed_field_names } = response.data;

      // Step 2: Build hidden form and submit to eSewa Developer Sandbox
      // IMPORTANT: total_amount MUST exactly match the string used in the HMAC signature
      const form = document.createElement("form");
      form.setAttribute("method", "POST");
      form.setAttribute("action", ESEWA_PAYMENT_URL);

      const fields: Record<string, string> = {
        amount: total_amount,         // same as total_amount (no tax/charges)
        tax_amount: "0",
        total_amount: total_amount,   // exact string that was signed on the backend
        transaction_uuid,
        product_code,
        product_service_charge: "0",
        product_delivery_charge: "0",
        success_url: `${window.location.origin}/payment/success`,
        failure_url: `${window.location.origin}/payment/failure`,
        signed_field_names,
        signature,
      };

      for (const [key, value] of Object.entries(fields)) {
        const input = document.createElement("input");
        input.setAttribute("type", "hidden");
        input.setAttribute("name", key);
        input.setAttribute("value", value);
        form.appendChild(input);
      }

      document.body.appendChild(form);
      form.submit();
    } catch (error: any) {
      const detail = error?.response?.data?.detail || "Could not connect to payment service.";
      toast.error(`Payment initiation failed: ${detail}`);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-card border border-border rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden"
      >
        {/* eSewa Header */}
        <div className="bg-gradient-to-r from-[#41a124] to-[#4caf50] p-6 flex justify-between items-center text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-2xl" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-inner">
              <span className="text-[#41a124] font-black text-xl italic">e</span>
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight block leading-none">eSewa</span>
              <span className="text-[10px] opacity-80 uppercase tracking-widest font-medium">
                Digital Wallet · Developer Sandbox
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-white/20 rounded-full transition-all hover:rotate-90 relative z-10 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Book info */}
          <div className="flex gap-4 items-center p-4 bg-secondary/30 rounded-2xl border border-border/50">
            <img
              src={book.cover}
              alt={book.title}
              className="w-14 aspect-[2/3] object-cover rounded-lg shadow-md flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="font-bold text-foreground truncate text-lg">{book.title}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider truncate">{book.author}</p>
              <p className="text-[#41a124] font-black text-xl mt-1">Rs. {amount}.00</p>
            </div>
          </div>

          {/* Info note */}
          <div className="flex gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <ExternalLink className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-300 leading-relaxed">
              You'll be securely redirected to eSewa's portal to log in and complete your payment. Do not close the
              browser window.
            </p>
          </div>

          {/* Pay button */}
          <Button
            onClick={handlePay}
            disabled={loading}
            className="w-full h-14 bg-[#41a124] hover:bg-[#369d1e] text-white font-bold text-lg rounded-2xl shadow-lg shadow-[#41a124]/25 hover:shadow-[#41a124]/40 transition-all active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Redirecting to eSewa...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span className="w-6 h-6 bg-white rounded flex items-center justify-center text-[#41a124] font-black text-sm italic">
                  e
                </span>
                Pay with eSewa
              </span>
            )}
          </Button>
        </div>

        {/* Footer */}
        <div className="px-8 pb-6 flex justify-center items-center gap-2">
          <ShieldCheck className="w-3 h-3 text-[#41a124]" />
          <span className="text-[9px] uppercase tracking-[0.2rem] font-bold text-muted-foreground/50">
            Secured by eSewa · PCI DSS Compliant
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default EsewaPaymentModal;
