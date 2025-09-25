export interface ToolBadge {
  label: string;
  tone: "green" | "blue" | "gray";
}

export interface Tool {
  id: number;
  icon: string;
  name: string;
  slug: string;
  description: string;
  isNew?: boolean;
  badge?: ToolBadge;
  disabled?: boolean;
}

export interface SearchAndViewProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  isGridView: boolean;
  setIsGridView: (value: boolean) => void;
}

export interface SlideData {
  toolName: string;
  title: string;
  subtitle: string;
  bullets: string[];
  image: string;
  imageAlt: string;
}

export interface SlideWithoutToolName {
  title: string;
  subtitle: string;
  bullets: string[];
  image: string;
  imageAlt: string;
}