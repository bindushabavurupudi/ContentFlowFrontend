import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

const resolveApiBaseUrl = () => {
  const configured = String(import.meta.env.VITE_API_BASE_URL || "").trim();
  if (configured) return configured.replace(/\/+$/, "");

  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return `${window.location.protocol}//${host}:8082`;
  }

  return "";
};

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, code: string): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    window.setTimeout(() => reject(new Error(code)), timeoutMs);
  });
  return (await Promise.race([promise, timeoutPromise])) as T;
};

export default function SignUp() {
  const { signUp: signUpDirect } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const apiBaseUrl = resolveApiBaseUrl();

  const signUpViaBackend = async (signupEmail: string, signupPassword: string, signupName: string) => {
    if (!apiBaseUrl) throw new Error("Backend API URL is not configured");

    const res = await withTimeout(
      fetch(`${apiBaseUrl}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signupEmail.trim().toLowerCase(),
          password: signupPassword,
          name: signupName.trim(),
        }),
      }),
      20000,
      "signup-timeout",
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error((data as { error?: string }).error || "Unable to create account");
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Full name is required";
    if (!email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Invalid email format";
    if (!password) e.password = "Password is required";
    else if (password.length < 6)
      e.password = "Minimum 6 characters required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      try {
        await signUpViaBackend(email, password, name);
      } catch (backendErr) {
        const backendMessage = backendErr instanceof Error ? backendErr.message : "Unable to create account";
        const retryDirect =
          backendErr instanceof TypeError ||
          /timeout|failed to fetch|network/i.test(backendMessage);

        if (!retryDirect) {
          throw backendErr;
        }

        await withTimeout(signUpDirect(email.trim(), password, name.trim()), 20000, "signup-timeout");
      }
      toast.success("Account created. Please sign in.");
      navigate("/signin", { replace: true, state: { fromSignup: true } });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to create account";
      const normalizedMessage = /signup-timeout/i.test(message)
        ? "Signup is taking too long. Please check backend/network and try again."
        : message;
      if (/already exists/i.test(message)) {
        setErrors({ email: "User already exists" });
        toast.error("User already exists");
        return;
      }

      toast.error(normalizedMessage);
      setErrors((p) => ({ ...p, email: normalizedMessage }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="glass-card rounded-2xl p-8 shadow-xl">
          <div className="flex justify-center mb-6">
            <Logo size="lg" />
          </div>

          <h1 className="text-2xl font-bold text-center mb-6">
            Create Your Account
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {errors.name && (
                <p className="text-xs text-destructive mt-1">
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors(p => ({ ...p, email: "" }));
                }}
              />
              {errors.email && (
                <p className="text-xs text-destructive mt-1">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
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
              {errors.password && (
                <p className="text-xs text-destructive mt-1">
                  {errors.password}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing Up..." : "Sign Up"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link
              to="/signin"
              className="text-primary font-semibold hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
