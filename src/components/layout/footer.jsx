// components/layout/Footer.jsx

import React from "react";
import SocialIcons from "../ui/socialIcons";

const Footer = ({ currentPage }) => {
  // Determine social icon styles based on current page
  const getSocialIconStyles = () => {
    switch (currentPage) {
      case "start": 
        return "bg-[#DFE8FA] text-[#265BD1] hover:bg-[#265BD1] hover:text-white transition-colors duration-500";
      case "fund": 
        return "bg-[#FF9378] text-[#5C1909] hover:bg-[#5C1909] hover:text-[#FF9378] transition-colors duration-500";
      case "join": 
        return "bg-[#YOUR_JOIN_BG_COLOR] text-[#YOUR_JOIN_TEXT_COLOR] hover:bg-[#YOUR_JOIN_HOVER_BG] hover:text-[#YOUR_JOIN_HOVER_TEXT] transition-colors duration-500";
      case "hire": 
        return "bg-[#YOUR_HIRE_BG_COLOR] text-[#YOUR_HIRE_TEXT_COLOR] hover:bg-[#YOUR_HIRE_HOVER_BG] hover:text-[#YOUR_HIRE_HOVER_TEXT] transition-colors duration-500";
      default: 
        return "bg-[#DFE8FA] text-[#265BD1] hover:bg-[#265BD1] hover:text-white transition-colors duration-500";
    }
  };

  return (
    <div className="fixed bottom-8 right-12 flex space-x-4">
      <SocialIcons className={getSocialIconStyles()} />
    </div>
  );
};

export default Footer;