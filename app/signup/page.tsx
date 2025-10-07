"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import OTPInput from "@/app/signup/components/OTPInput";
import { useUser } from "@/hooks/useUser";

type Step = "choose" | "email" | "otp" ;

// Strictly use env-configured URLs; no fallback.
const OTP_URI = process.env.NEXT_PUBLIC_OTP_URI as string | undefined;
const VERIFY_URI = process.env.NEXT_PUBLIC_VERIFY_URI as string | undefined;

type SendOtpResponse = {
  message?: string;
  request_id?: string;
  expires_in?: number;
  error?: string;
};

export default function Signup() {
  const router = useRouter();
  const { user } = useUser();

  const [step, setStep] = useState<Step>("choose");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  // request_id returned by OTP_URI; required by VERIFY_URI
  const [requestId, setRequestId] = useState<string | null>(null);

  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);

  // resend timer (UI throttle)
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

  const sameOrigin = (url: string) =>
    new URL(url, window.location.href).origin === window.location.origin;

  // Keep headers minimal to satisfy CORS: only Content-Type: application/json
  const postJSON = (url: string, body: unknown) =>
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: sameOrigin(url) ? "include" : "omit",
      cache: "no-store",
      body: JSON.stringify(body),
    });

  // Google
  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/start", { credentials: "include" });
      const data = await res.json();
      if (data?.authUrl) window.location.href = data.authUrl;
      else setError("Unable to start Google sign-in. Please try again.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // helper (optional)
  const parseResponse = async (res: Response) => {
    const text = await res.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch {}
    return { data, text };
  };

  const handleSendOtp = async () => {
    setError(null);
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return setError("Please enter a valid email address.");
    }

    setLoading(true);
    try {
      // 1) Send OTP to provider
      const sendRes = await fetch(OTP_URI!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trimmedName ? { email: trimmedEmail, name: trimmedName } : { email: trimmedEmail }),
      });
      const { data: sendData, text: sendText } = await parseResponse(sendRes);

      if (!sendRes.ok) {
        setError(sendData?.message || sendData?.error || sendText || "Failed to send verification code.");
        return;
      }

      const reqId: string | undefined = sendData?.request_id;
      const expiresIn: number | undefined = sendData?.expires_in;
      if (!reqId) {
        setError("Server did not return request_id. Please try again.");
        return;
      }

      // 2) Persist mapping on your server (request_id -> email, name)
      await fetch("/api/auth/otp-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          request_id: reqId,
          email: trimmedEmail,
          name: trimmedName || undefined,
          expires_in: expiresIn,
        }),
      });

      // 3) Move to OTP step
      setRequestId(reqId);
      setStep("otp");
      startResendCountdown(60);
    } catch {
      setError("Failed to send verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (remainingSeconds > 0) return;
    setError(null);
    setLoading(true);
    try {
      const trimmedName = name.trim();
      const trimmedEmail = email.trim();

      // 1) Resend via provider (returns a NEW request_id)
      const resendRes = await fetch(OTP_URI!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trimmedName ? { email: trimmedEmail, name: trimmedName } : { email: trimmedEmail }),
      });
      const { data: resendData, text: resendText } = await parseResponse(resendRes);

      if (!resendRes.ok) {
        setError(resendData?.message || resendData?.error || resendText || "Failed to resend code.");
        return;
      }

      const newReqId: string | undefined = resendData?.request_id;
      const expiresIn: number | undefined = resendData?.expires_in;
      if (!newReqId) {
        setError("Server did not return request_id on resend. Please try again.");
        return;
      }

      // 2) Update mapping on your server
      await fetch("/api/auth/otp-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          request_id: newReqId,
          email: trimmedEmail,
          name: trimmedName || undefined,
          expires_in: expiresIn,
        }),
      });

      // 3) Update state and timer
      setRequestId(newReqId);
      startResendCountdown(60);
    } catch {
      setError("Failed to resend code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError(null);
    const code = otp.trim();
    if (!/^\d{6}$/.test(code)) return setError("Please enter the 6-digit code.");
    if (!requestId) return setError("Missing request ID. Please send/resend OTP first.");

    setLoading(true);
    try {
      // IMPORTANT: verify against YOUR API so it can upsert user + set session cookie
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({ request_id: requestId, otp: code }),
      });
      const { data, text } = await parseResponse(res);

      if (!res.ok || data?.ok === false) {
        setError(data?.message || text || "Invalid or expired code. Please try again.");
        return;
      }

      // Session cookie is now set; /api/me will return the user
      router.replace("/");
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  

  const maskedEmail = useMemo(() => {
    const trimmed = email.trim();
    const [userPart, domain] = trimmed.split("@");
    if (!userPart || !domain) return trimmed;
    const visible = userPart.slice(0, 2);
    const hidden = userPart.length > 2 ? "•".repeat(Math.max(1, userPart.length - 2)) : "";
    return `${visible}${hidden}@${domain}`;
  }, [email]);

  return (
    <div className="min-h-screen blue-bg-dots flex justify-center items-center p-4">
      <div className="bg-white rounded-[22px] shadow-md max-w-lg w-full">
        {step === "choose" && (
          <div className="flex flex-col gap-4 px-6 sm:px-8 pt-8 pb-3 items-center">
            <Image src="/icons/success.svg" alt="Create account" width={64} height={64} />
            <h1 className="text-2xl font-semibold text-black text-center">Create an account</h1>
            <p className="text-sm text-secondary-db-70 text-center">
              Get started in minutes. Stay sorted forever
            </p>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="bg-primary-way-100 hover:bg-primary-way-90 cursor-pointer text-white w-full py-3 rounded-lg transition-all duration-200 disabled:opacity-60 flex itemscenter justify-center gap-2"
            >
              <Image src="/icons/google.svg" alt="Google" width={20} height={20} />
              {loading ? "Redirecting..." : "Continue with Google"}
            </button>

            <button
              onClick={() => setStep("email")}
              disabled={loading}
              className="bg-secondary-db-5 text-secondary-db-100 cursor-pointer w-full py-3 rounded-lg transition-all duration-200 disabled:opacity-60"
            >
              Continue with Email
            </button>

            <p className="text-xs text-secondary-db-70 text-center">
              Creating an account means you agree to our{" "}
              <span className="text-primary-way-100 underline cursor-pointer">Terms</span> and{" "}
              <span className="text-primary-way-100 underline cursor-pointer">Privacy Policy</span>.
            </p>
          </div>
        )}

        {step === "email" && (
          <div className="flex flex-col gap-5 px-6 sm:px-8 pt-8 pb-3">
            <h1 className="text-2xl font-semibold text-black text-center">Create an account</h1>
            <p className="text-sm text-secondary-db-70 text-center">
              Enter your email and we’ll send you a verification code
            </p>

            <div className="relative">
              <label className="absolute -top-2 left-3 px-1 bg-white text-xs text-secondary-db-70" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-secondary-db-20 bg-white outline-none focus:ring-2 focus:ring-primary-way-100"
              />
              <p className="text-xs text-secondary-db-70 mt-1">Your name will be used to personalize the email</p>
            </div>

            <div className="relative">
              <label className="absolute -top-2 left-3 px-1 bg-white text-xs text-secondary-db-70" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-secondary-db-20 bg-white outline-none focus:bg-white focus:ring-2 focus:ring-primary-way-100"
              />
              <p className="text-xs text-secondary-db-70 mt-1">Enter a valid email address to receive the OTP</p>
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
              onClick={handleSendOtp}
              disabled={loading || !validateEmail(email)}
              className="bg-primary-way-100 hover:bg-primary-way-90 cursor-pointer text-white w-full py-3 rounded-lg transition-all duration-200 disabled:opacity-60"
            >
              {loading ? "Sending code..." : "Send OTP"}
            </button>
          </div>
        )}

        {step === "otp" && (
          <div className="flex flex-col gap-5 px-6 sm:px-8 pt-6 pb-4">
            <div className="w-full">
              <button
                onClick={() => {
                  setError(null);
                  setStep("email");
                }}
                className="text-secondary-db-70 hover:text-secondary-db-100 text-sm flex items-center gap-2"
              >
                <span className="text-xl leading-none">←</span> Back
              </button>
            </div>

            <h2 className="text-2xl font-semibold text-black text-center">Verify OTP</h2>
            <p className="text-sm text-secondary-db-70 text-center">
              We’ve sent a verification code to {maskedEmail || "your email"}.
              <br />
              Enter the code to verify and continue.
            </p>

            <OTPInput length={6} value={otp} onChange={setOtp} onComplete={setOtp} />

            <p className="text-xs text-secondary-db-70 text-center">
              Resend Code in {remainingLabel}
            </p>

            {error && <p className="text-xs text-red-500 text-center">{error}</p>}

            <button
              onClick={handleVerify}
              disabled={loading || otp.length !== 6 || !requestId}
              className="bg-primary-way-100 hover:bg-primary-way-90 text-white w-full py-3 rounded-lg transition-all duration-200 disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <button
              onClick={handleResend}
              disabled={remainingSeconds > 0 || loading}
              className="text-sm text-primary-way-100 disabled:text-secondary-db-40"
            >
              Resend Code
            </button>
          </div>
        )}

        <div className="border-t border-secondary-db-5 w-full text-center py-4">
          {(step === "choose" || step === "email") && (
            <p className="text-sm text-secondary-db-70">
              Already have an account?{" "}
              <span className="text-primary-way-100 underline cursor-pointer" onClick={() => router.push("/login")}>
                Log in
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}