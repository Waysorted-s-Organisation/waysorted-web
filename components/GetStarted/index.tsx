const GetStarted = () => {
  return (
    <section className="bg-white flex flex-col items-center justify-center text-center px-4
                        py-16 sm:py-24 md:py-40">
      {/* Heading (unchanged at md+) */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-secondary-db-100 text-center leading-tight">
        One tool. Infinite possibilities.
      </h1>

      {/* Subheading (unchanged at md+) */}
      <p className="mt-3 sm:mt-4 text-secondary-db-80 font-medium
                    text-base sm:text-lg md:text-xl
                    text-center max-w-xl sm:max-w-2xl md:max-w-6xl">
        Waysorted transforms your workflow,<span className="text-primary-way-100"> Instantly.</span>
      </p>

      {/* Button (original 7xl preserved at md+; smaller on small screens) */}
      <div
        className="mt-8 sm:mt-10 md:mt-12 rounded-4xl text-white font-medium
                   text-lg sm:text-2xl md:text-7xl
                   px-18 py-6 sm:px-20 sm:py-8 md:px-25 md:py-10
                   bg-secondary-db-100 join-shadow cursor-pointer
                   w-full max-w-xs sm:max-w-sm md:max-w-none md:w-auto mx-auto text-center"
        aria-label="Get Started Button"
      >
        Get Started!
      </div>
    </section>
  );
};

export default GetStarted;