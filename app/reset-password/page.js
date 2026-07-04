"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  auth,
  signInWithEmailAndPassword,
} from "../../lib/firebase";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState("");

  // Firebase passes oobCode as query parameter
  const oobCode = searchParams.get("oobCode");
  const mode = searchParams.get("mode");

  useEffect(() => {
    if (!oobCode) {
      setStatus({
        type: "error",
        message: "Invalid reset link. Please request a new password reset.",
      });
      return;
    }

    // Verify the oobCode and get the associated email
    const verifyCode = async () => {
      try {
        const email = await verifyPasswordResetCode(auth, oobCode);
        setVerifiedEmail(email);
        console.log("✅ Reset code verified for:", email);
      } catch (err) {
        console.error("❌ Invalid or expired reset code:", err);
        setStatus({
          type: "error",
          message: "This reset link has expired or is invalid. Please request a new one.",
        });
      }
    };

    verifyCode();
  }, [oobCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setStatus({ type: "error", message: "Passwords do not match." });
      return;
    }

    if (password.length < 6) {
      setStatus({
        type: "error",
        message: "Password must be at least 6 characters.",
      });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: "", message: "" });

    try {
      // Step 1: Confirm the password reset in Firebase Auth
      await confirmPasswordReset(auth, oobCode, password);
      console.log("✅ Firebase password reset confirmed");

      // Step 2: Sign in with the new password to get an ID token
      const userCredential = await signInWithEmailAndPassword(
        auth,
        verifiedEmail,
        password
      );
      const idToken = await userCredential.user.getIdToken();

      // Step 3: Sync the new password to MongoDB
      const syncRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/sync-firebase-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ idToken, password }),
        }
      );

      if (syncRes.ok) {
        console.log("✅ Password synced to MongoDB");
      }

      setStatus({
        type: "success",
        message:
          "Password reset successful! Redirecting to login...",
      });
      setTimeout(() => {
        router.push("/signin");
      }, 2000);
    } catch (err) {
      console.error("❌ Reset password error:", err);
      let errorMessage = "Failed to reset password. Please try again.";
      if (err.code === "auth/expired-action-code") {
        errorMessage = "This reset link has expired. Please request a new one.";
      } else if (err.code === "auth/invalid-action-code") {
        errorMessage =
          "This reset link is invalid. It may have already been used.";
      } else if (err.code === "auth/weak-password") {
        errorMessage = "Password is too weak. Please use a stronger password.";
      }
      setStatus({ type: "error", message: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isInvalidLink = !oobCode || (status.type === "error" && !verifiedEmail);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white border border-gray-100 shadow-xl rounded-2xl p-8 w-full max-w-md"
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-orange-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Set New Password
        </h2>
        <p className="text-center text-gray-600 mb-8">
          {verifiedEmail
            ? `Enter a new password for ${verifiedEmail}`
            : "Enter your new password below."}
        </p>

        {isInvalidLink ? (
          <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-center">
            <p className="font-medium">{status.message}</p>
            <button
              onClick={() => router.push("/signin")}
              className="mt-4 text-orange-600 font-semibold hover:underline"
            >
              Go to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-all"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-all"
                required
                minLength={6}
              />
            </div>

            {status.message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-lg text-sm font-medium ${
                  status.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {status.message}
              </motion.div>
            )}

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitting || status.type === "success"}
              className={`w-full py-3 rounded-lg font-bold shadow-md transition-all ${
                isSubmitting || status.type === "success"
                  ? "bg-orange-300 cursor-not-allowed"
                  : "bg-orange-500 hover:bg-orange-600 hover:shadow-lg"
              } text-white`}
            >
              {isSubmitting
                ? "Resetting..."
                : status.type === "success"
                ? "Redirecting..."
                : "Reset Password"}
            </motion.button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-center text-gray-600">
            Remember your password?{" "}
            <span
              onClick={() => router.push("/signin")}
              className="text-orange-600 font-bold cursor-pointer hover:underline"
            >
              Login
            </span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-gray-500">Loading...</div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
