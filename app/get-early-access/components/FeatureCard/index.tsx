import { cn } from "@/lib/cn";
import Image from "next/image";

type Props = {
  title: string;
  description: string;
  tilt?: string; // e.g., rotate-2, -rotate-2
};

export default function FeatureCard({ title, description, tilt }: Props) {
  return (
    <div
      className={cn(
        "relative rounded-2xl bg-white text-black shadow-card px-5 sm:px-6 py-4 sm:py-5",
        "ring-1 ring-slate-200",
        tilt
      )}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-white">
          <Image
            src="/icons/check.svg"
            alt="Check"
            width={18}
            height={18}
          />
        </span>
        <div>
          <h3 className="font-semibold text-black">{title}</h3>
          <p className="mt-1 text-sm text-black">{description}</p>
        </div>
      </div>
    </div>
  );
}