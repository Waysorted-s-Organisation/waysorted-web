import { cn } from "@/lib/cn";
import Image from "next/image";

type Props = {
  title: string;
  description: React.ReactNode;
  tilt?: string;
};

export default function FeatureCard({ title, description, tilt }: Props) {
  return (
    <div
      className={cn(
        "relative w-full rounded-2xl bg-white text-black px-5 py-5 shadow-lg border border-slate-100",
        tilt
      )}
    >
      <div className="flex items-start gap-4">
        {/* Check Icon */}
        <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-way-100 text-white">
          <Image
            src="/icons/check.svg"
            alt="Check"
            width={14}
            height={14}
            className="text-white"
          />
        </span>
        
        {/* Text Content */}
        <div>
          <h3 className="font-semibold text-slate-900 text-base">{title}</h3>
          <div className="mt-1 text-sm text-slate-600 leading-relaxed">
            {description}
          </div>
        </div>
      </div>
    </div>
  );
}