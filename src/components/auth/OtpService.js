// src/components/Auth/OtpService.js
import emailjs from "emailjs-com";

export async function sendOtpEmail(email, otp) {
  // show expiry time nicely
  const expiryTime = new Date(Date.now() + 15 * 60 * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  try {
    await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
      { to_email: email, passcode: otp, time: expiryTime },
      import.meta.env.VITE_EMAILJS_PUBLIC_KEY
    );
    return { ok: true };
  } catch (e) {
    console.error("OTP email failed:", e);
    return { ok: false, error: e?.message || "Email send failed" };
  }
}
