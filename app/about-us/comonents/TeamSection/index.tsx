"use client";

import Image from "next/image";
import { teams } from "@/app/about-us/data/team";
import { team1 as team1Data } from "@/app/about-us/data/team1";
import GlowStarButton from "@/components/GlowStarButton";
import { useEffect, useState } from "react";

interface TeamMemberProps {
  name: string;
  role: string;
  image: string;
}

const TeamMember: React.FC<TeamMemberProps> = ({ name, role, image }) => {
  return (
    <div className="bg-white rounded-xl text-center">
      <div className="relative w-[276px] h-[300px] bg-dots mx-auto rounded-xl overflow-hidden mb-4">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover"
          sizes="150px"
          priority
        />
      </div>
      <h3 className="text-xl font-semibold text-secondary-db-100">{name}</h3>
      <p className="text-secondary-db-80 font-regular text-xl">{role}</p>
    </div>
  );
};

const JoinUsMobile = () => (
  <div className="relative bg-[#1627fa] w-full rounded-2xl px-5 py-6 mt-8 flex flex-col items-start justify-center">
    <Image
      src="/icons/bow.svg"
      alt="Bow"
      width={48}
      height={48}
      className="absolute -top-4 right-4 z-10"
    />
    <p className="text-white text-2xl font-semibold mb-1 text-left w-full">Join our Team !</p>
    <p className="text-white text-lg font-medium mb-1 text-left w-full">Build the Way with us.</p>
    <p className="text-white text-sm mb-4 text-left w-full">
      Be part of a fast-moving startup, where your work makes a real impact from day one.
    </p>
    <GlowStarButton
      onClick={() => window.open("https://discord.gg/", "_blank")}
      className="bg-[#181C1F] text-white px-6 py-3 rounded-xl font-semibold text-base flex items-center justify-center w-full"
      style={{ minHeight: "48px" }}
    >
      Join Our Discord
      <Image
        src="/icons/arrow-white.svg"
        alt="Arrow Right"
        width={16}
        height={16}
        className="inline-block ml-3"
      />
    </GlowStarButton>
  </div>
);

const JoinUsDesktop = () => (
  <div className="relative bg-[var(--tertiary-vivid-blue-500)] w-[276px] h-[300px] text-white rounded-xl flex flex-col justify-center p-5">
    <Image
      src="/icons/bow.svg"
      alt="Bow"
      width={72}
      height={72}
      className="absolute -top-7 -right-4 z-10"
    />
    <p className="text-3xl font-semibold mb-2 text-left">Join our <br /> Team!</p>
    <div className="text-base text-secondary-db-5 mb-4 text-left font-medium">
      <p className="mb-4 text-lg">Build the Way with us.</p>
      <p className="text-sm">Be part of a fast-moving startup, where your work makes a real impact from day one.</p>
    </div>
    <GlowStarButton
      onClick={() => window.open("https://discord.gg/", "_blank")}
      className="bg-secondary-db-100 text-white px-4 py-2 font-semibold text-base rounded-xl cursor-pointer"
    >
      Join Our Discord
      <Image
        src="/icons/arrow-white.svg"
        alt="Arrow Right"
        width={12}
        height={12}
        className="inline-block text-base ml-3"
      />
    </GlowStarButton>
  </div>
);

export default function TeamSection() {
  const team = teams;
  const team1 = team1Data;
  const [isMobile, setIsMobile] = useState(false);

  // Track window size to detect below md (768px)
  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  if (isMobile) {
    // Stack all members, and add JoinUsMobile after the last member in each group
    return (
      <section className="bg-white px-6 pt-12 pb-40 text-center">
        <div className="flex flex-col gap-y-8 max-w-xs mx-auto">
          {team.map((member, index) => (
            <TeamMember
              key={index}
              name={member.name}
              role={member.role}
              image={member.image}
            />
          ))}
          {team1.map((member, index) => (
            <TeamMember
              key={index}
              name={member.name}
              role={member.role}
              image={member.image}
            />
          ))}
          {team1.length > 0 && <JoinUsMobile />}
        </div>
      </section>
    );
  }

  // Desktop & md+ (unchanged from your original)
  return (
    <section className="bg-white px-6 md:px-20 lg:px-32 pt-12 pb-40 text-center">
      <div className="grid gap-y-8 gap-x-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 justify-center max-w-6xl mx-auto">
        {team.map((member, index) => (
          <TeamMember
            key={index}
            name={member.name}
            role={member.role}
            image={member.image}
          />
        ))}
        <JoinUsDesktop />
      </div>
      <div className="grid gap-y-8 gap-x-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 justify-center max-w-6xl mt-8 mx-auto">
        {team1.map((member, index) => (
          <TeamMember
            key={index}
            name={member.name}
            role={member.role}
            image={member.image}
          />
        ))}
      </div>
    </section>
  );
}