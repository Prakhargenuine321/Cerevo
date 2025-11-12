/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();

  const getCustomErrorMessage = (error) => {
    const errorCode = error?.code || '';
    const errorMessages = {
      'auth/invalid-email': 'Please enter a valid email address',
      'auth/user-disabled': 'Your account has been disabled. Contact support.',
      'auth/user-not-found': 'No account found with this email address',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/invalid-credential': 'Invalid email or password. Please try again.',
      'auth/too-many-requests': 'Too many failed login attempts. Please try again later.',
      'auth/operation-not-allowed': 'Login service is currently unavailable.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
      'auth/internal-error': 'An internal error occurred. Please try again.',
    };
    return errorMessages[errorCode] || error?.message || 'Login failed. Please try again.';
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setBusy(true);
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      toast.success("Logged in successfully!");
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      const customErrorMsg = getCustomErrorMessage(err);
      setAuthError(customErrorMsg);
      toast.error(customErrorMsg);
    } finally {
      setBusy(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email first");
      return;
    }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      toast.success("Password reset email sent! Check your inbox.");
      setAuthError(null);
    } catch (err) {
      console.error("Password reset error:", err);
      toast.error(err?.message || "Failed to send reset email");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0A0F1C] text-white font-inter">
      {/* Background Lights */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-32 w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[350px] h-[350px] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Login Card */}
      <motion.form
        onSubmit={handleLogin}
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md p-8 rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-[0_4px_40px_rgba(0,0,0,0.4)] space-y-6"
      >
        {/* Title */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl sm:text-4xl font-semibold bg-linear-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-sm text-gray-400">Your journey continues here</p>
        </div>

        {/* Input Fields */}
        <div className="space-y-4">
          <div className="relative group">
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-md text-sm placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/40 transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="relative group">
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-md text-sm placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-purple-400/40 transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Login Button */}
        <motion.button
          whileHover={{
            scale: 1.03,
            boxShadow: "0 0 15px rgba(147, 51, 234, 0.4)",
          }}
          whileTap={{ scale: 0.97 }}
          disabled={busy || resetLoading}
          type="submit"
          className="w-full py-3 rounded-lg text-sm font-medium bg-linear-to-r from-cyan-600/70 to-purple-600/70 hover:from-cyan-500/80 hover:to-purple-500/80 border border-white/10 text-white transition-all disabled:opacity-60"
        >
          {busy ? "Signing in..." : "Login"}
        </motion.button>

        {/* Error Message with Forgot Password Link */}
        {authError && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-xs text-red-200 mb-2">{authError}</p>
            <button
              onClick={handleForgotPassword}
              disabled={resetLoading}
              className="text-xs text-cyan-300 underline hover:text-cyan-200 transition-all disabled:opacity-60"
            >
              {resetLoading ? "Sending reset email..." : "Forgot Password?"}
            </button>
          </div>
        )}

        {/* Register Link */}
        <div className="text-center text-sm text-gray-400">
          Don’t have an account?{" "}
          <span
            onClick={() => navigate("/register")}
            className="text-cyan-300 underline cursor-pointer hover:text-purple-300 transition-all"
          >
            Register Here
          </span>
        </div>
      </motion.form>
    </div>
  );
}
