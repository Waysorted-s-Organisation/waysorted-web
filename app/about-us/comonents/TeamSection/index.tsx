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
      <h3 className="text-xl font-semibold text-secondary-db-100">{name}</h3>
      <p className="text-secondary-db-100/50 font-regular text-xl">{role}</p>
    </div>
  );
};

export default function TeamSection() {
  const team = teams;
  const team1 = team1Data;

  return (

    <section className="bg-white px-6 md:px-20 lg:px-32 py-40 text-center">
      {/* Heading */}
      <span className="inline-flex items-center text-sm font-medium bg-secondary-db-5 text-secondary-db-100 rounded-md mb-6">
        <Image
          src="/icons/team.svg"
          alt="Our Team"
          width={30}
          height={30}
          className="block p-1"
        />
        <span className="pl-1 pr-2 py-1 text-secondary-db-100">Way Team</span>
      </span>

      <h2 className="text-3xl md:text-4xl font-bold text-secondary-db-100 mb-3">
        Meet the <span className="bg-tertiary-vivid-blue-500/10 rounded-xl text-tertiary-vivid-blue-500 px-2">
          Minds
        </span> Behind the Magic
      </h2>
      <p className="text-secondary-db-70 max-w-xl mx-auto mb-16 text-lg">
        A small team with a big mission — turning chaotic workflows into seamless creativity.
      </p>

      {/* Team Members Grid */}
      <div className="grid gap-y-8 gap-x-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 justify-center max-w-6xl mx-auto">
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
          className="relative bg-[var(--tertiary-vivid-blue-500)] w-[276px] h-[300px] text-white rounded-xl flex flex-col justify-center p-5"
        >
            <Image
                src="/icons/bow.svg"
                alt="Bow"
                width={72}
                height={72}
                className="absolute -top-7 -right-4 z-10"
            />
          <p className="text-3xl font-semibold mb-2 text-left">Join our <br /> Team!</p>
          <div className="text-base text-secondary-db-5 mb-4 text-left font-medium">
            <p className="mb-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
          </div>
          <a
            href="https://discord.gg/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-secondary-db-100 text-white px-4 py-2 font-semibold text-base rounded-xl"
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
