import { useState } from "react";
import api from "@/lib/api";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Book, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await api.post("/auth/forgot-password", { email });
            setEmailSent(true);
            toast.success("Password reset instructions sent to your email!");
        } catch (error: any) {
            const errorMessage = error.response?.data?.detail || "Failed to send reset email. Please try again.";
            toast.error(errorMessage);
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center gradient-hero px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {}
                <Link to="/" className="flex items-center justify-center gap-2 mb-8">
                    <Book className="h-10 w-10 text-primary" />
                    <span className="font-heading text-2xl font-bold text-foreground">Bookify</span>
                </Link>

                {}
                <div className="gradient-card rounded-2xl p-8 border border-border/50 shadow-card">
                    <div className="text-center mb-8">
                        <h1 className="font-heading text-2xl font-bold text-foreground mb-2">
                            {emailSent ? "Check Your Email" : "Forgot Password?"}
                        </h1>
                        <p className="text-muted-foreground">
                            {emailSent
                                ? "We've sent password reset instructions to your email address."
                                : "Enter your email address and we'll send you instructions to reset your password."
                            }
                        </p>
                    </div>

                    {!emailSent ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 bg-secondary border-border"
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                variant="hero"
                                className="w-full"
                                size="lg"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                ) : (
                                    "Send Reset Instructions"
                                )}
                            </Button>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
                                <p className="text-sm text-foreground">
                                    If an account exists with <strong>{email}</strong>, you will receive password reset instructions shortly.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                    setEmailSent(false);
                                    setEmail("");
                                }}
                            >
                                Try Another Email
                            </Button>
                        </div>
                    )}

                    <div className="mt-8 text-center">
                        <Link to="/login" className="inline-flex items-center gap-2 text-primary hover:underline font-medium">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Login
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
