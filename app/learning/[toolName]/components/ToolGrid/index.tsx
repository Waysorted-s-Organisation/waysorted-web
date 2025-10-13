import ToolCard from "../ToolCard/index";
import { ITool } from "@/models/tool";

export default function ToolsGrid({ tools }: { tools: ITool[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {tools.map((tool) => (
        <ToolCard key={tool.slug} tool={tool} />
      ))}
    </div>
  );
}