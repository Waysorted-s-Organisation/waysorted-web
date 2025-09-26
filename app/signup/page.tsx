"use client";
import { useState, useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Signup() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [user, router]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/start");
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        console.error("No authUrl returned", data);
      }
    } catch (err) {
      console.error("Error starting auth", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen blue-bg-dots flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-md max-w-md w-full flex flex-col justify-center items-center">
        <div className="flex flex-col justify-center items-center gap-4 px-8 pt-8 pb-4 w-full">
          <Image src="/icons/success.svg" alt="Success" width={40} height={40} />
          <h1 className="text-xl font-semibold text-black">Create an account</h1>
          <h3 className="text-sm text-secondary-db-70 text-center">
            Sign up quickly using your Google account.
          </h3>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="bg-secondary-db-5 hover:bg-primary-way-100 text-secondary-db-100 hover:text-white w-full py-2 flex items-center justify-center gap-2 rounded-lg cursor-pointer transition-all duration-200 disabled:opacity-60"
          >
            <Image src="/icons/google.svg" alt="Google" width={20} height={20} />
            {loading ? "Redirecting..." : "Continue with Google"}
          </button>

          <button
            disabled
            className="bg-secondary-db-5 text-secondary-db-40 w-full py-2 rounded-lg cursor-not-allowed"
          >
            Continue with Email (Coming Soon)
          </button>

          <p className="text-xs pt-2 text-center text-secondary-db-70">
            Creating an account means you agree to our{" "}
            <span className="text-primary-way-100 underline cursor-pointer">
              Terms
            </span>{" "}
            and{" "}
            <span className="text-primary-way-100 underline cursor-pointer">
              Privacy Policy
            </span>
            .
          </p>
        </div>

        <div className="border-t border-secondary-db-5 w-full text-center py-4 text-base font-semibold">
          <p>
            Already have an account?{" "}
            <span
              className="text-primary-way-100 underline cursor-pointer"
              onClick={handleGoogleSignIn}
            >
              Login
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}