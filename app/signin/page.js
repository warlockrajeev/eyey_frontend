"use client";

import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { auth, sendPasswordResetEmail } from "../../lib/firebase";

export default function SignInPage() {
  const { login, signup, googleLogin, user, fetchCurrentUser, isLoggingOut, hasLoggedOut } = useAuth();
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetStatus, setResetStatus] = useState({ type: "", message: "" });
  const [isResetting, setIsResetting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  // Test function to check API connectivity
  const testAPIConnection = async () => {
    try {
      console.log("🔄 Testing API connection...");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/me`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      console.log("🔄 API Test Response Status:", response.status);
      console.log("🔄 API Test Response Headers:", [
        ...response.headers.entries(),
      ]);

      if (response.status === 401) {
        console.log(
          "✅ API is reachable (401 Unauthorized is expected for unauthenticated requests)"
        );
      } else {
        const data = await response.text();
        console.log("🔄 API Test Response Data:", data);
      }
    } catch (error) {
      console.error("❌ API Test Error:", error);
    }
  };

  // Redirect if user is already logged in
  useEffect(() => {
    if (user && !isLoggingOut && !hasLoggedOut) {
      console.log("👤 User already logged in, redirecting to home...");
      router.push("/");
    }
  }, [user, isLoggingOut, hasLoggedOut, router]);

  // Load current user on page load if logged in
  useEffect(() => {
    console.log("🔄 SignIn page mounting, testing API connection...");
    testAPIConnection();

    // Only fetch current user if not logging out or hasn't recently logged out
    if (!isLoggingOut && !hasLoggedOut) {
      fetchCurrentUser();
    } else {
      console.log("🚪 SignIn page: Skipping fetchCurrentUser - user is logging out or has logged out");
    }
  }, [fetchCurrentUser, isLoggingOut, hasLoggedOut]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("🔄 Form submission started", { isSignup, form });
    try {
      if (isSignup) {
        console.log("🔄 Attempting signup...");
        await signup(form.name, form.email, form.password);
        console.log("✅ Signup completed successfully");
        router.push("/");
      } else {
        console.log("🔄 Attempting login...");
        await login(form.email, form.password);
        console.log("✅ Login completed successfully");
        router.push("/");
      }
    } catch (err) {
      console.error("❌ Auth error:", err);
      console.error("❌ Error details:", {
        message: err.message,
        stack: err.stack,
        name: err.name,
      });
      alert(`Error: ${err.message}`);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      console.log("🔄 Attempting Google Login...");
      await googleLogin();
      console.log("✅ Google Login successful");
      router.push("/");
    } catch (err) {
      console.error("❌ Google Login error:", err);
      alert(`Google Login Error: ${err.message}`);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      setResetStatus({ type: "error", message: "Please enter your email address." });
      return;
    }
    setIsResetting(true);
    setResetStatus({ type: "", message: "" });
    try {
      // Step 1: Call backend to ensure user exists in Firebase Auth
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: resetEmail }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setResetStatus({ type: "error", message: data.message });
        return;
      }

      // Step 2: Use Firebase to send the password reset email
      await sendPasswordResetEmail(auth, resetEmail);
      setResetStatus({ type: "success", message: "Password reset email sent! Check your inbox." });
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetEmail("");
        setResetStatus({ type: "", message: "" });
      }, 3000);
    } catch (err) {
      console.error("❌ Password reset error:", err);
      setResetStatus({ type: "error", message: "Failed to send reset email. Please try again." });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white border border-gray-100 shadow-xl rounded-2xl p-8 w-full max-w-md"
      >
        {/* Heading */}
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">
          {isSignup ? "Create an Account" : "Welcome Back"}
        </h2>
        <p className="text-center text-gray-600 mb-8">
          {isSignup ? "Join us and get started!" : "Login to continue to Eyey"}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {isSignup && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-all"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-all"
              required
            />
          </div>

          {!isSignup && (
            <div className="flex justify-end">
              <span
                onClick={() => {
                  setShowForgotPassword(true);
                  setResetEmail(form.email);
                  setResetStatus({ type: "", message: "" });
                }}
                className="text-sm text-orange-600 hover:text-orange-700 cursor-pointer font-medium transition-colors"
              >
                Forgot password?
              </span>
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-bold shadow-md hover:shadow-lg transition-all"
          >
            {isSignup ? "Sign Up" : "Login"}
          </motion.button>
        </form>

        {/* Or Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200"></span>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        {/* Google Login Button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleGoogleLogin}
          type="button"
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold shadow-sm hover:bg-gray-50 transition-all"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          Google
        </motion.button>

        {/* Switch Login/Signup */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-center text-gray-600">
            {isSignup ? "Already have an account?" : "Don’t have an account?"}{" "}
            <span
              onClick={() => setIsSignup(!isSignup)}
              className="text-orange-600 font-bold cursor-pointer hover:underline"
            >
              {isSignup ? "Login" : "Sign Up"}
            </span>
          </p>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotPassword && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            onClick={() => {
              setShowForgotPassword(false);
              setResetStatus({ type: "", message: "" });
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Reset Password</h3>
                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetStatus({ type: "", message: "" });
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 mb-6">
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-all"
                    required
                    autoFocus
                  />
                </div>
                {resetStatus.message && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-lg text-sm font-medium ${
                      resetStatus.type === "success"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {resetStatus.message}
                  </motion.div>
                )}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isResetting}
                  className={`w-full py-3 rounded-lg font-bold shadow-md transition-all ${
                    isResetting
                      ? "bg-orange-300 cursor-not-allowed"
                      : "bg-orange-500 hover:bg-orange-600 hover:shadow-lg"
                  } text-white`}
                >
                  {isResetting ? "Sending..." : "Send Reset Link"}
                </motion.button>
              </form>
              <p className="mt-4 text-center text-sm text-gray-500">
                Remember your password?{" "}
                <span
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetStatus({ type: "", message: "" });
                  }}
                  className="text-orange-600 font-semibold cursor-pointer hover:underline"
                >
                  Back to Login
                </span>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
