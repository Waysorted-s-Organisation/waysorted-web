export interface Tool {
  id: number;
  icon: string;
  name: string;
  slug: string;
  description: string;
  isNew?: boolean;
}

export interface SearchAndViewProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  isGridView: boolean;
  setIsGridView: (value: boolean) => void;
}