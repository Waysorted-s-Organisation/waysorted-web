"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Tool } from "../../types";
import { Badge } from "../Badge";

export default function ToolListItem({ tool }: { tool: Tool }) {
  const router = useRouter();
  const badge = tool.badge;

  return (
    <div className="bg-white border border-secondary-db-5 rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gray-200">
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
            {tool.nameLogo && <Image src={tool.nameLogo} alt={tool.name} width={20} height={20} className="inline-block ml-1" />}
            {badge && <Badge type={badge.type} label={badge.label} showDot={true} />}
          </h2>
          <a className="text-xs text-secondary-db-70 cursor-pointer">
            <Image
              src="/icons/open.svg"
              alt="Open in Figma"
              width={12}
              height={12}
              className="inline object-contain mr-1"
            />
            Figma Plugin
          </a>
        </div>
      </div>
      <p className="text-secondary-db-70 w-xs font-medium text-left text-sm">
        {tool.description}
      </p>
      <button
        onClick={() => router.push(`/learning/${tool.slug}`)}
        className="text-secondary-db-100 hover:text-primary-way-100 text-sm font-medium flex items-center cursor-pointer"
      >
        Learn more
        <span className="relative ml-1 w-3 h-2">
          <Image
            src="/icons/arrow-right-black.svg"
            alt="Arrow Right"
            fill
            className="object-contain"
          />
        </span>
      </button>
    </div>
  );
}
