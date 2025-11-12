import React, { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { sendOtpEmail } from "./OtpService";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const EXAMS = ["GATE", "IIT-JEE"];

export default function Register() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [username, setUsername] = useState("");
  const [exam, setExam] = useState("");
  const [examDate, setExamDate] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const generateOtp = async () => {
    if (!email) {
      toast.error("Please enter your email first");
      return;
    }
    setBusy(true);
    try {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      setGeneratedOtp(code);
      const res = await sendOtpEmail(email.trim(), code);
      if (res.ok) {
        setOtpSent(true);
        toast.success("OTP sent to your email!");
      } else {
        toast.error(res.error || "Failed to send OTP");
      }
    } catch (err) {
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = () => {
    if (!otp) {
      toast.error("Please enter the OTP");
      return;
    }
    if (otp === generatedOtp) {
      setOtpVerified(true);
      toast.success("Email verified successfully!");
      setStep(2);
    } else {
      toast.error("Invalid OTP. Please try again.");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!otpVerified) {
      toast.error("Please verify your email first");
      return;
    }
    if (!username || !exam || !examDate || !password) {
      toast.error("Please fill all required fields");
      return;
    }

    setBusy(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: username });

      await setDoc(doc(db, "users", cred.user.uid), {
        userId: cred.user.uid,
        email: email.trim(),
        name: username,
        exam,
        examDate,
        createdAt: new Date().toISOString(),
      });

      toast.success("Registration successful! Welcome aboard!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err?.message || "Registration failed. Please try again.");
      console.error('Registration error:', err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#0A0F1C] text-white px-4 overflow-hidden font-inter">
      {/* Subtle Background Lights */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-20%] w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-20%] w-[350px] h-[350px] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Glassmorphic Card */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md p-8 rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-[0_4px_40px_rgba(0,0,0,0.4)] space-y-6"
      >
        <div className="text-center space-y-1">
          <h1 className="text-3xl sm:text-4xl font-semibold bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
            Create Account
          </h1>
          <p className="text-sm text-gray-400">
            Start your preparation journey with us.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <label className="text-sm text-gray-300">Email</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 p-2 bg-white/5 border border-white/15 rounded-md text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-400/40 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button
                  type="button"
                  onClick={generateOtp}
                  disabled={busy}
                  className="px-3 py-2 rounded-md bg-gradient-to-r from-cyan-600 to-blue-600 font-medium text-white text-sm hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {busy ? "Sending..." : "Generate OTP"}
                </button>
              </div>

              <label className="text-sm text-gray-300">Enter OTP</label>
              <input
                type="text"
                placeholder="6-digit code"
                maxLength={6}
                className="w-full p-2 bg-white/5 border border-white/15 rounded-md text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400/40 transition-all text-center tracking-widest mb-3"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              />

              <button
                onClick={verifyOtp}
                className="w-full py-2 rounded-md text-sm font-medium bg-gradient-to-r from-gray-100/10 to-gray-200/20 hover:from-gray-200/20 hover:to-gray-100/10 border border-white/10 text-white transition-all"
                disabled={!otpSent}
              >
                Verify Email
              </button>

              <p className="text-xs text-center mt-3 text-gray-400">
                {otpSent
                  ? "OTP sent. Check your inbox."
                  : "Click Generate OTP to receive a code."}
              </p>
            </motion.div>
          )}

          {step === 2 && (
            <motion.form
              key="step2"
              onSubmit={handleRegister}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              <div>
                <label className="text-sm text-gray-300">Username</label>
                <input
                  type="text"
                  className="w-full p-2 bg-white/5 border border-white/15 rounded-md text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-400/40 transition-all"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-300">Preparing for</label>
                <select
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-md text-sm text-white font-medium appearance-none cursor-pointer focus:ring-2 focus:ring-purple-400/60 focus:outline-none focus:border-purple-400/60 transition-all hover:bg-white/15 option:bg-slate-900 option:text-white"
                  value={exam}
                  onChange={(e) => setExam(e.target.value)}
                  required
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center',
                    backgroundSize: '20px',
                    paddingRight: '36px',
                  }}
                >
                  <option value="" className="bg-slate-900 text-gray-400">Select Exam</option>
                  {EXAMS.map((x) => (
                    <option key={x} value={x} className="bg-slate-900 text-white">
                      {x}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-300">
                  Exam Date (tentative/original)
                </label>
                <input
                  type="date"
                  className="w-full p-2 bg-white/5 border border-white/15 rounded-md text-sm text-white focus:ring-2 focus:ring-pink-400/40 transition-all"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-300">Password</label>
                <input
                  type="password"
                  className="w-full p-2 bg-white/5 border border-white/15 rounded-md text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-400/40 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-2 rounded-md text-sm font-medium bg-gradient-to-r from-cyan-600/70 to-purple-600/70 hover:from-cyan-500/80 hover:to-purple-500/80 border border-white/10 text-white transition-all disabled:opacity-50"
              >
                {busy ? "Registering..." : "Register"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <p className="text-center text-sm mt-4 text-gray-400">
          Already have an account?{" "}
          <span
            className="text-cyan-300 underline cursor-pointer hover:text-purple-300 transition-all"
            onClick={() => navigate("/")}
          >
            Sign in
          </span>
        </p>
      </motion.div>
    </div>
  );
}
