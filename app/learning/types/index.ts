export interface ToolBadge {
  label: string;
  type: "new" | "up next" | "unlock soon";
}

export interface Tool {
  id: number;
  icon: string;
  name: string;
  nameLogo?: string;
  slug: string;
  description: string;
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