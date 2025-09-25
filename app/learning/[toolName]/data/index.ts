interface SlideData {
  toolName: string;
  title: string;
  subtitle: string;
  bullets: string[];
  image: string;
  imageAlt: string;
}

// Import the JSON data
import slidesData from './index.json';

// Export the data with proper typing
export const allSlides: SlideData[] = slidesData;

export default allSlides;

export type { SlideData };