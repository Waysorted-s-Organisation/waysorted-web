"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Tool } from "@/app/learning/types";
import { Badge } from "@/app/learning/components/Badge";
import React from "react";

export default function ToolListItem({ tool }: { tool: Tool }) {
  const router = useRouter();
  const isDisabled = tool.disabled === true;
  const badge = tool.badge;

  const onLearnMore = () => {
    if (isDisabled) return;
    router.push(`/learning/${tool.slug}`);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (isDisabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onLearnMore();
    }
  };

  return (
    <div
      onClick={onLearnMore}
      onKeyDown={onKeyDown}
      role="link"
      tabIndex={isDisabled ? -1 : 0}
      aria-label={
        isDisabled
          ? `${tool.name} is coming soon`
          : `Learn more about ${tool.name}`
      }
      className={`group bg-white border border-secondary-db-5 rounded-xl p-4 flex items-center justify-between outline-none ${
        isDisabled
          ? "opacity-70 cursor-not-allowed"
          : "hover:bg-primary-way-5 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary-way-100"
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gray-200 overflow-hidden">
          <Image
            src={tool.icon}
            alt={tool.name}
            width={60}
            height={60}
            className="object-contain"
          />
        </div>
        <div>
          <h2 className="font-medium w-xs text-xl text-secondary-db-100 flex items-center">
            {tool.name}
            {tool.nameLogo && (
              <Image
                src={tool.nameLogo}
                alt={tool.name}
                width={20}
                height={20}
                className="inline-block ml-1"
              />
            )}
            {badge && (
              <Badge type={badge.type} label={badge.label} showDot={true} />
            )}
          </h2>
          {/* Non-interactive since the whole row is clickable */}
          <span className="text-xs text-secondary-db-70 cursor-default select-none">
            <Image
              src="/icons/open.svg"
              alt="Open in Figma"
              width={12}
              height={12}
              className="inline object-contain mr-1"
            />
            Figma Plugin
          </span>
        </div>
      </div>

      <p className="text-secondary-db-70 w-xs font-medium text-left text-sm">
        {tool.description}
      </p>

      {/* Non-interactive "Learn more" since the whole row is clickable */}
      <div
        className={`text-sm font-medium flex items-center ${
          isDisabled
            ? "text-secondary-db-40"
            : "text-primary-way-100"
        }`}
      >
        Learn more
        <span className="relative ml-1 w-3 h-2">
          <svg
            width="6"
            height="10"
            viewBox="0 0 6 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M1 9L4.64645 5.35355C4.84171 5.15829 4.84171 4.84171 4.64645 4.64645L1 1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </div>
    </div>
  );
}