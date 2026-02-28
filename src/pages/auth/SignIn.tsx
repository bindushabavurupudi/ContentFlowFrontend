import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { supabaseRuntimeInfo } from "@/lib/supabase";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export default function SignIn() {
  const { signIn, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fromSignup = Boolean((location.state as { fromSignup?: boolean } | null)?.fromSignup);

  useEffect(() => {
    if (user && !fromSignup) navigate("/dashboard");
  }, [user, fromSignup, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await signIn(email.trim(), password);
      toast.success("Login successful");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setIsSubmitting(false);
      const message = err instanceof Error ? err.message : "Login failed";
      if (err instanceof TypeError && /fetch/i.test(message)) {
        console.error("Login fetch failed", {
          message,
          supabaseUrl: supabaseRuntimeInfo.url,
          anonKeyPresent: supabaseRuntimeInfo.anonKeyPresent,
          mode: supabaseRuntimeInfo.mode,
          online: navigator.onLine,
        });
        toast.error("Cannot reach Supabase. Check internet/VPN/firewall and browser extensions.");
        return;
      }
      toast.error(message);
    }
  };

  return (
  <div className="auth-bg flex items-center justify-center p-4">
    <div className="w-full max-w-md">
      <div className="glass-card rounded-2xl p-8 shadow-xl">
        <div className="flex justify-center mb-6">
          <Logo size="lg" />
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">
          Welcome Back
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Sign in to continue to your dashboard
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting || isLoading}>
            {isSubmitting || isLoading ? "Signing In..." : "Sign In"}
          </Button>
        </form>

        <p className="text-center text-sm mt-4">
          <Link to="/signup" className="text-primary">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  </div>
);
}
