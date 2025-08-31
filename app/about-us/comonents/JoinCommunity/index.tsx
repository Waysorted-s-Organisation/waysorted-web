import React from "react";

const JoinCommunity = () => {
  return (
    <section className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
      {/* Heading */}
      <h1 className="text-3xl md:text-5xl font-semibold text-[#131B23] text-center">
        Join Our Community
      </h1>

      {/* Subheading */}
      <p className="mt-3 text-[#131B23]/70 font-normal text-xl text-center max-w-xl">
        Be part of a growing network of designers who believe in faster, smarter,
        and frustration-free workflows.
      </p>

      {/* Button */}
      <button
        className="mt-8 rounded-4xl text-white font-medium text-7xl 
                   bg-[#131B23] join-shadow cursor-pointer"
      >
        Join Now !
      </button>
    </section>
  );
};

export default JoinCommunity;
