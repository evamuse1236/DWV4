import { useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../hooks/useAuth";

/**
 * Login page with Paper UI glass card design
 * Inspired by refined.so - "InnerSpace" portal aesthetic
 */
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Check if system needs initial setup (no users exist)
  const needsBootstrap = useQuery(api.auth.checkNeedsBootstrap);

  // Get redirect path from location state or use default
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Please enter your username");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }

    setIsLoading(true);

    try {
      const success = await login(username, password);

      if (success) {
        // Redirect based on role
        if (user?.role === "admin") {
          navigate("/admin", { replace: true });
        } else if (from) {
          navigate(from, { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      } else {
        setError("Oops! Wrong username or password. Try again?");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
        className="w-full max-w-[480px]"
      >
        {/* Glass Card */}
        <div
          className="rounded-[32px] p-[60px] text-center"
          style={{
            background: "rgba(255, 255, 255, 0.6)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.8)",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.05)",
          }}
        >
          {/* Logo / Title */}
          <div className="mb-12">
            <h1 className="font-display text-[40px] leading-none text-[#1a1a1a]">
              Deep Work
            </h1>
            <p
              className="mt-2 text-[11px] uppercase tracking-[0.2em]"
              style={{ color: "#888" }}
            >
              Sanctuary for the Mind
            </p>
          </div>

          {/* First-run setup banner */}
          {needsBootstrap && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 rounded-2xl text-center"
              style={{
                background: "rgba(168, 197, 181, 0.3)",
                border: "1px solid rgba(168, 197, 181, 0.5)",
              }}
            >
              <p className="text-sm mb-3" style={{ color: "#2d5a3d" }}>
                Welcome! Let's set up your first admin account.
              </p>
              <button
                type="button"
                onClick={() => navigate("/setup")}
                className="px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider"
                style={{
                  background: "#2d5a3d",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Begin Setup
              </button>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="text-left mb-10">
            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-3 rounded-lg text-sm"
                style={{
                  background: "rgba(255, 200, 200, 0.5)",
                  color: "#8B0000",
                }}
              >
                {error}
              </motion.div>
            )}

            {/* Username Input */}
            <div className="input-minimal-group">
              <input
                type="text"
                className="input-minimal"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={isLoading}
              />
              <label className="input-label-floating">Identity</label>
            </div>

            {/* Password Input */}
            <div className="input-minimal-group">
              <input
                type="password"
                className="input-minimal"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={isLoading}
              />
              <label className="input-label-floating">Key</label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn breathing-glow w-full py-4 px-8 mt-6 rounded-full border-none cursor-pointer disabled:opacity-50"
              style={{
                background: "#1a1a1a",
                color: "white",
                fontFamily: "var(--font-body)",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                transition: "transform 0.2s",
              }}
            >
              {isLoading ? "Opening..." : "Enter Sanctuary"}
            </button>
          </form>

          {/* Footer Quote */}
          <div style={{ opacity: 0.5, fontSize: "12px" }}>
            <p className="italic font-display">"The only journey is the one within."</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default LoginPage;
