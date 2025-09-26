import ToolListItem from "../ToolListItem/index";
import { Tool } from "../../types";

export default function ToolsList({ tools }: { tools: Tool[] }) {
  return (
    <div className="flex flex-col gap-3">
      {tools.map((tool) => (
        <ToolListItem key={tool.id} tool={tool} />
      ))}
    </div>
  );
}
