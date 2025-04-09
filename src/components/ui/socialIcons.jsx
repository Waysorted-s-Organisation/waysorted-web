import React from "react";
import { FaLinkedinIn, FaDiscord, FaXTwitter } from "react-icons/fa6";
import { AiFillInstagram } from "react-icons/ai";

const socialLinks = [
  { id: "instagram", icon: AiFillInstagram, link: "https://www.instagram.com/waysorted?igsh=MXBwazdvZ3lzaHFmeQ%3D%3D&utm_source=qr" },
  { id: "linkedin", icon: FaLinkedinIn, link: "https://www.linkedin.com/company/waysortedhq/" },
  { id: "discord", icon: FaDiscord, link: "https://discord.com" },
  { id: "twitter", icon: FaXTwitter, link: "https://x.com/waysorted?s=21" },
];


const SocialIcons = ({ className = "" }) => {
  return (
    <div className="flex space-x-2">
      {socialLinks.map(({ id, icon: Icon, link }) => (
        <a
          key={id}
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className={`w-10 h-10 rounded-full flex items-center justify-center transition duration-300 ${className}`}
        >
          <Icon className="w-5 h-5" />
        </a>
      ))}
    </div>
  );
};

export default SocialIcons;
