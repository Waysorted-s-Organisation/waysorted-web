import ToolListItem from "../ToolListItem/index";
import { ITool } from "@/models/tool";

export default function ToolsList({ tools }: { tools: ITool[] }) {
  return (
    <div className="flex flex-col gap-2 sm:gap-3">
      {tools.map((tool) => (
        <ToolListItem key={tool.slug} tool={tool} />
      ))}
    </div>
  );
}