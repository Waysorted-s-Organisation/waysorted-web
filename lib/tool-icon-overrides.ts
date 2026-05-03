type ToolLike = {
  slug?: string;
  icon?: string;
};

const TOOL_ICON_OVERRIDES: Record<string, string> = {
  "html-to-design": "/images/html-to-design/icon.svg",
  "icon-library": "/images/icon-library/icon.svg",
};

export function getToolIconOverride(slug?: string) {
  if (!slug) return undefined;
  return TOOL_ICON_OVERRIDES[slug];
}

export function applyToolIconOverride<T extends ToolLike>(tool: T): T {
  const override = getToolIconOverride(tool.slug);
  if (!override || tool.icon === override) return tool;

  return {
    ...tool,
    icon: override,
  };
}

export function applyToolIconOverrides<T extends ToolLike>(tools: T[]) {
  return tools.map(applyToolIconOverride);
}
