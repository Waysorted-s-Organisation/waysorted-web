import HeroSection from "./comonents/HeroSection";
import VisionSection from "./comonents/VisionSection";
import ValuesSection from "./comonents/ValueSection";
import StorySection from "./comonents/StorySection";
import TeamSection from "./comonents/TeamSection";
import TeamCollage from "./comonents/TeamCollage";
import JoinCommunity from "./comonents/JoinCommunity";

export default function AboutUs() {
  return (
    <>
      <HeroSection />
      <StorySection />
      <ValuesSection />
      <TeamSection />
      <VisionSection />
      <TeamCollage />
      <JoinCommunity />
    </>
  );
}
