"use client";
import { useRouter } from "next/navigation";

type TopBannerProps = {
    earlyAccess: boolean;
};

export default function TopBanner({ earlyAccess }: TopBannerProps) {
    const router = useRouter();
  return (
    <div className="top-banner">
      {!earlyAccess && (
        <div className="mx-auto flex max-w-screen items-center justify-between gap-4 px-4 py-3 sm:px-6 bg-primary-way-10">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-primary-way-100 bg-primary-way-10 text-xs font-medium text-primary-way-100 cursor-pointer"
              title="Info"
          >
            !
          </span>
          <p className="text-sm text-primary-way-100">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus empor vulputate.
          </p>
        </div>
        <div className="shrink-0">
          <button 
            onClick={()=> router.push("/get-early-access")}
            className="bg-primary-way-10 border border-primary-way-100 rounded-lg text-sm font-medium text-primary-way-100 p-2 cursor-pointer">Get early access</button>
        </div>
      </div>
        )}
    </div>
  );
}