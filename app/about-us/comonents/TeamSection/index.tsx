"use client";

import Image from "next/image";
import {teams} from "@/app/about-us/data/team";
import {team1 as team1Data} from "@/app/about-us/data/team1";

interface TeamMemberProps {
  name: string;
  role: string;
  image: string;
}

const TeamMember: React.FC<TeamMemberProps> = ({ name, role, image }) => {
  return (
    <div
      className="bg-white rounded-xl text-center"
    >
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
      <h3 className="text-xl font-semibold text-primary-dark">{name}</h3>
      <p className="text-primary-dark/50 font-medium text-xl">{role}</p>
    </div>
  );
};

export default function TeamSection() {
  const team = teams;
  const team1 = team1Data;

  return (

    <section className="bg-white px-6 md:px-20 lg:px-32 py-16 text-center">
      {/* Heading */}
      <span className="inline-flex items-center text-sm font-medium bg-[#F3F3F3] text-[#565A5E] rounded-md mb-4">
        <Image
          src="/icons/avail.svg"
          alt="Our Team"
          width={24}
          height={24}
          className="block"
        />
        <span className="px-3 py-1">Our Team</span>
      </span>

      <h2 className="text-3xl md:text-4xl font-bold text-[#0D1218] mb-2">
        Meet the <span className="bg-[#182DEE]/10 rounded-xl text-[#182DEE] px-2">
          Minds
        </span> Behind the Magic
      </h2>
      <p className="text-[#565A5E] max-w-xl mx-auto mb-10 text-lg">
        A small team with a big mission — turning chaotic workflows into seamless creativity.
      </p>

      {/* Team Members Grid */}
      <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 justify-center max-w-6xl mx-auto">
        {team.map((member, index) => (
          <TeamMember
            key={index}
            name={member.name}
            role={member.role}
            image={member.image}
          />
        ))}

        {/* Call to Action Card */}
        <div
          className="relative bg-[var(--team-card)] w-[276px] h-[300px] text-white rounded-xl flex flex-col justify-center p-5"
        >
            <Image
                src="/icons/bow.svg"
                alt="Bow"
                width={50}
                height={50}
                className="absolute -top-5 -right-4 z-40"
            />
          <p className="text-3xl font-semibold mb-2 text-left">Join our <br /> Team!</p>
          <p className="text-base text-white/70 mb-4 text-center font-medium">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>
          <a
            href="https://discord.gg/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary-dark text-white px-4 py-2 font-semibold text-base rounded-xl"
          >
            Join Our Discord
            <Image
                src="/icons/arrow-white.svg"
                alt="Arrow Right"
                width={12}
                height={12}
                className="inline-block text-base ml-3"
            />
          </a>
        </div>
      </div>
      <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 justify-center max-w-6xl mt-8 mx-auto">
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
