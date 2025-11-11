"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ITool } from "@/models/tool";
import { Badge } from "@/app/learning/components/Badge";
import React from "react";

export default function ToolListItem({ tool }: { tool: ITool }) {
  const router = useRouter();
  const isDisabled = tool.disabled === true;
  const badge = tool.badge;

  const onLearnMore = (e?: React.MouseEvent<HTMLAnchorElement>) => {
    if (isDisabled) {
      e?.preventDefault();
      return;
    }
    e?.preventDefault();
    router.push(`/learning/${tool.slug}`);
  };

  return (
    <div
      className={`group bg-white border border-secondary-db-5 rounded-xl p-3 sm:p-4 flex items-center justify-between gap-3 outline-none ${
        isDisabled ? "opacity-70 cursor-not-allowed" : "hover:bg-primary-way-5"
      }`}
    >
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-200 overflow-hidden shrink-0">
          <Image
            src={`${tool.iconData}`}
            alt={tool.name}
            width={60}
            height={60}
            className="object-contain"
          />
        </div>
        <div className="min-w-0">
          <h2 className="font-medium text-base sm:text-xl text-secondary-db-100 flex items-center gap-2">
            <span className="truncate">{tool.name}</span>
            {tool.isAI && (
              <Image
                src={"/icons/ai-logo.svg"}
                alt={`${tool.name} AI`}
                width={20}
                height={20}
                className="inline-block"
              />
            )}
            {badge && (
              <span className="shrink-0">
                <Badge type={badge.type} label={badge.label} showDot={true} />
              </span>
            )}
          </h2>

          {/* Open in Figma link (keeps placement/size; uses provided open.svg; hover color + icon via currentColor) */}
          <a
            href="https://figma.com/community/plugin/1532842109377504268/waysorted"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open in Figma"
            className={`hidden sm:inline text-xs select-none ${
              isDisabled
                ? "pointer-events-none opacity-70 text-secondary-db-80"
                : "text-secondary-db-80 hover:text-primary-way-100"
            }`}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="inline object-contain mr-1 align-[-2px]"
              aria-hidden="true"
            >
              <path
                d="M11.7592 3.46127C11.7592 2.66348 11.112 2.01367 10.3173 2.01367H8.3947C8.13034 2.01367 7.91405 2.23081 7.91405 2.4962C7.91405 2.7616 8.13034 2.97874 8.3947 2.97874H10.1186L7.01364 6.0959C6.82618 6.28409 6.82618 6.58969 7.01364 6.77788C7.20109 6.96607 7.51191 6.95963 7.69295 6.77788L10.7979 3.66072V5.3914C10.7979 5.65679 11.0142 5.87393 11.2786 5.87393C11.5429 5.87393 11.7592 5.65679 11.7592 5.3914V3.46127Z"
                fill="currentColor"
              />
              <path
                d="M2.23089 10.9135C2.40713 11.1789 2.62983 11.4025 2.89419 11.5794C3.4998 11.9864 4.3858 11.9864 6.15138 11.9864C7.91696 11.9864 8.80295 11.9864 9.40857 11.5794C9.67292 11.4025 9.89562 11.1789 10.0719 10.9135C10.4564 10.3361 10.4756 9.50454 10.4772 7.96526C10.4772 7.83659 10.4275 7.71596 10.3362 7.62427C10.2449 7.53259 10.1247 7.48273 9.99656 7.48273C9.7306 7.48273 9.51591 7.69826 9.51591 7.96526C9.51591 9.35978 9.49027 10.0514 9.27398 10.3779C9.16824 10.5372 9.03366 10.6723 8.87665 10.7768C8.51296 11.0213 7.67503 11.0213 6.15298 11.0213C4.63093 11.0213 3.793 11.0213 3.42931 10.7768C3.27069 10.6707 3.13771 10.5356 3.03197 10.3779C2.78844 10.0128 2.78844 9.1716 2.78844 7.64358C2.78844 6.11556 2.78844 5.27434 3.03197 4.90922C3.13771 4.74999 3.2723 4.61649 3.42931 4.51033C3.75455 4.29158 4.44508 4.26746 5.83255 4.26585C6.0969 4.26585 6.31319 4.04871 6.31319 3.78331C6.31319 3.51792 6.0969 3.30078 5.83255 3.30078C4.29768 3.30078 3.47096 3.32008 2.89579 3.70772C2.63303 3.88465 2.40873 4.10822 2.23249 4.37361C1.82715 4.9816 1.82715 5.87107 1.82715 7.64358C1.82715 9.41608 1.82715 10.3055 2.23249 10.9135H2.23089Z"
                fill="currentColor"
              />
            </svg>
            Figma Plugin
          </a>
        </div>
      </div>

      <p className="text-secondary-db-70 font-medium text-xs sm:text-sm text-left w-auto sm:w-xs max-w-[55%] sm:max-w-none">
        {tool.tagline}
      </p>

      {/* Learn more link (hover color change; arrow uses currentColor) */}
      <a
        href={isDisabled ? undefined : `/learning/${tool.slug}`}
        onClick={onLearnMore}
        aria-label={
          isDisabled
            ? `${tool.name} is coming soon`
            : `Learn more about ${tool.name}`
        }
        aria-disabled={isDisabled}
        tabIndex={isDisabled ? -1 : 0}
        className={`text-sm font-medium items-center flex shrink-0 ${
          isDisabled
            ? "text-secondary-db-40 cursor-not-allowed pointer-events-none"
            : "text-secondary-db-100 hover:text-primary-way-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-way-100 rounded"
        }`}
      >
        <span className="hidden sm:inline">Learn more</span>
        <span className="relative ml-1 w-3 h-2">
          <svg
            width="6"
            height="10"
            viewBox="0 0 6 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="stroke-current"
          >
            <path
              d="M1 9L4.64645 5.35355C4.84171 5.15829 4.84171 4.84171 4.64645 4.64645L1 1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </a>
    </div>
  );
}