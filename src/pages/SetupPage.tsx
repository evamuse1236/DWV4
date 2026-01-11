import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button, Input, Card } from "../components/paper";
import { motion } from "framer-motion";

/**
 * First-time setup page
 * Creates the admin account and seeds initial data
 */
export function SetupPage() {
  const navigate = useNavigate();
  const initializeAdmin = useMutation(api.auth.initializeAdmin);
  const seedAll = useMutation(api.seed.seedAll);

  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateAdmin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!displayName.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setIsLoading(true);

    try {
      const result = await initializeAdmin({
        username,
        password,
        displayName,
      });

      if (result.success) {
        setStep(2);
      } else {
        setError(result.error || "Failed to create admin account");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error("Setup error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedData = async () => {
    setIsLoading(true);
    setError("");

    try {
      await seedAll({});
      setStep(3);
    } catch (err) {
      setError("Failed to seed data. Please try again.");
      console.error("Seed error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card className="p-8">
          {/* Step 1: Create Admin */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="text-center mb-8">
                <span className="text-5xl mb-4 block">🎓</span>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Welcome, Coach!
                </h1>
                <p className="text-gray-600">
                  Let's set up your Deep Work Tracker
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateAdmin} className="space-y-4">
                <Input
                  label="Your Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g., Coach Vishwa"
                  disabled={isLoading}
                />
                <Input
                  label="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  disabled={isLoading}
                />
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  disabled={isLoading}
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Type password again"
                  disabled={isLoading}
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={isLoading}
                >
                  Create My Account
                </Button>
              </form>
            </motion.div>
          )}

          {/* Step 2: Seed Data */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <span className="text-5xl mb-4 block">✨</span>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Account Created!
              </h1>
              <p className="text-gray-600 mb-6">
                Now let's add the starter content - emotions, learning domains, and some great books!
              </p>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="text-left p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">This will add:</p>
                  <ul className="text-sm space-y-1">
                    <li>😊 5 emotion categories with sub-emotions</li>
                    <li>📚 4 learning domains (Math, Reading, Coding, Writing)</li>
                    <li>📖 8 starter books for the reading library</li>
                  </ul>
                </div>

                <Button
                  onClick={handleSeedData}
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={isLoading}
                >
                  Add Starter Content
                </Button>

                <Button
                  onClick={() => setStep(3)}
                  variant="ghost"
                  fullWidth
                  disabled={isLoading}
                >
                  Skip for now
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Done */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <span className="text-5xl mb-4 block">🎉</span>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                All Set!
              </h1>
              <p className="text-gray-600 mb-6">
                Your Deep Work Tracker is ready to go. Time to help your students learn and grow!
              </p>

              <div className="space-y-4">
                <div className="text-left p-4 bg-primary-50 rounded-lg border border-primary-200">
                  <p className="text-sm font-medium text-primary-800 mb-2">
                    Next steps:
                  </p>
                  <ol className="text-sm text-primary-700 space-y-1 list-decimal list-inside">
                    <li>Log in with your new account</li>
                    <li>Create student accounts</li>
                    <li>Set up your first sprint</li>
                    <li>Add learning objectives</li>
                  </ol>
                </div>

                <Button
                  onClick={handleFinish}
                  variant="primary"
                  size="lg"
                  fullWidth
                >
                  Go to Login 🚀
                </Button>
              </div>
            </motion.div>
          )}
        </Card>

        {/* Progress indicator */}
        <div className="flex justify-center gap-2 mt-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full transition-colors ${
                s <= step ? "bg-primary-600" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default SetupPage;
