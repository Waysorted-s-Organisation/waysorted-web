"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import OTPInput from "@/app/login/components/OTPInput";
import { useUser } from "@/hooks/useUser";

type Step = "choose" | "email" | "otp" | "verified";

export default function Login() {
  const router = useRouter();
  const { user } = useUser();

  const [step, setStep] = useState<Step>("choose");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);

  // resend timer
  const [resendAt, setResendAt] = useState<number>(0);
  const [now, setNow] = useState<number>(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const remainingSeconds = useMemo(() => {
    const diff = Math.ceil((resendAt - now) / 1000);
    return Math.max(0, diff);
  }, [resendAt, now]);
  const remainingLabel = useMemo(() => {
    const m = Math.floor(remainingSeconds / 60);
    const s = remainingSeconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [remainingSeconds]);

  const validateEmail = (val: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

  const startResendCountdown = (seconds = 60) => {
    setResendAt(Date.now() + seconds * 1000);
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/start");
      const data = await res.json();
      if (data?.authUrl) {
        window.location.href = data.authUrl;
      } else {
        setError("Unable to start Google sign-in. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const goEmailStep = () => {
    setError(null);
    setStep("email");
  };

  const sendOtp = async () => {
    setError(null);
    if (!validateEmail(email)) return setError("Please enter a valid email address.");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setError(data?.message || "Failed to send verification code.");
        return;
      }
      setStep("otp");
      startResendCountdown(60);
    } catch {
      setError("Failed to send verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (remainingSeconds > 0) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setError(data?.message || "Failed to resend code.");
        return;
      }
      startResendCountdown(60);
    } catch {
      setError("Failed to resend code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setError(null);
    if (otp.length !== 6) return setError("Please enter the 6-digit code.");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: otp }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setError(data?.message || "Invalid or expired code. Please try again.");
        return;
      }
      setStep("verified");
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen blue-bg-dots flex justify-center items-center p-4">
      <div className="bg-white rounded-[22px] shadow-md max-w-lg w-full">
        {step === "choose" && (
          <div className="flex flex-col gap-4 px-6 sm:px-8 pt-8 pb-3 items-center">
            <Image src="/icons/success.svg" alt="Welcome back" width={64} height={64} />
            <h1 className="text-2xl font-semibold text-black text-center">Welcome back!</h1>
            <p className="text-sm text-secondary-db-70 text-center">
              Log in to continue your way of working smarter.
            </p>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="bg-primary-way-100 hover:bg-primary-way-90 cursor-pointer text-white w-full py-3 rounded-lg transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <Image src="/icons/google.svg" alt="Google" width={20} height={20} />
              {loading ? "Redirecting..." : "Continue with Google"}
            </button>

            <button
              onClick={goEmailStep}
              disabled={loading}
              className="bg-secondary-db-5 text-secondary-db-100 cursor-pointer w-full py-3 rounded-lg transition-all duration-200 disabled:opacity-60"
            >
              Continue with Email
            </button>
          </div>
        )}

        {step === "email" && (
          <div className="flex flex-col gap-4 px-6 sm:px-8 pt-8 pb-3 items-center">
            <Image src="/icons/success.svg" alt="Welcome back" width={56} height={56} />
            <h1 className="text-2xl font-semibold text-black text-center">Welcome back!</h1>
            <p className="text-sm text-secondary-db-70 text-center">
              Enter your email and we’ll send you a verification code
            </p>

            {/* Email field with inline label inside border */}
            <div className="w-full relative">
              <label
                className="absolute -top-2 left-3 px-1 bg-white text-xs text-secondary-db-70"
                htmlFor="email"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-secondary-db-20 cursor-pointer bg-white outline-none focus:ring-2 focus:ring-primary-way-100"
              />
            </div>

            {error && <p className="text-xs text-red-500 w-full">{error}</p>}

            <button
              onClick={sendOtp}
              disabled={loading}
              className="bg-primary-way-100 hover:bg-primary-way-90 text-white w-full py-3 rounded-lg transition-all duration-200 disabled:opacity-60"
            >
              {loading ? "Sending code..." : "Continue"}
            </button>
          </div>
        )}

        {step === "otp" && (
          <div className="flex flex-col gap-5 px-6 sm:px-8 pt-6 pb-4">
            <div className="w-full">
              <button
                onClick={() => setStep("email")}
                className="text-secondary-db-70 hover:text-secondary-db-100 text-sm flex items-center gap-2"
              >
                <span className="text-xl leading-none">←</span> Back
              </button>
            </div>

            <h2 className="text-2xl font-semibold text-black text-center">OTP Verification</h2>
            <p className="text-sm text-secondary-db-70 text-center">
              We’ve sent a verification code OTP to Email.
              <br />
              Enter the code to verify and continue.
            </p>

            <OTPInput length={6} value={otp} onChange={setOtp} onComplete={setOtp} />

            <p className="text-xs text-secondary-db-70 text-center">
              Resend Code in {remainingLabel}
            </p>

            {error && <p className="text-xs text-red-500 text-center">{error}</p>}

            <button
              onClick={verifyOtp}
              disabled={loading}
              className="bg-primary-way-100 hover:bg-primary-way-90 text-white w-full py-3 rounded-lg transition-all duration-200 disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Verify"}
            </button>

            <button
              onClick={resendOtp}
              disabled={remainingSeconds > 0 || loading}
              className="text-sm text-primary-way-100 disabled:text-secondary-db-40"
            >
              Resend Code
            </button>
          </div>
        )}

        {step === "verified" && (
          <div className="flex flex-col justify-center items-center gap-4 px-6 sm:px-8 pt-10 pb-8">
            <Image src="/icons/success.svg" alt="Verified" width={56} height={56} />
            <h2 className="text-xl font-semibold text-black">Account Verified</h2>
            <p className="text-sm text-secondary-db-70 text-center">Welcome Back to Waysorted 🚀</p>
            <button
              onClick={() => router.replace("/")}
              className="bg-primary-way-100 hover:bg-primary-way-90 text-white w-full py-3 rounded-lg transition-all duration-200"
            >
              Continue to Way
            </button>
          </div>
        )}

        {/* Bottom divider with "Sign up" link on choose and email steps */}
        <div className="border-t border-secondary-db-5 w-full text-center py-4">
          {(step === "choose" || step === "email") && (
            <p className="text-sm text-secondary-db-70">
              Don’t have an account?{" "}
              <span
                className="text-primary-way-100 underline cursor-pointer"
                onClick={() => router.push("/signup")}
              >
                Sign up
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}