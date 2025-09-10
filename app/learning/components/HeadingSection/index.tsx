import Image from "next/image";

export default function HeadingSection() {
  return (
    <div className="max-w-7xl mx-auto px-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
      {/* Left Side */}
      <div>
        <div className="flex items-center gap-2 my-4">
          <span className="inline-flex items-center text-sm font-medium bg-secondary-db-5 text-secondary-db-100 rounded-md">
            <Image
              src="/icons/waylearn.svg"
              alt="WayLearning"
              width={30}
              height={30}
              className="block p-1"
            />
            <span className="pl-1 pr-2 py-1 text-secondary-db-100">WayLearning</span>
          </span>
        </div>
        <h1 className="text-6xl w-lg font-semibold text-secondary-db-100 leading-tight">
          All You Need to Know about Tools
        </h1>
      </div>

      {/* Right Side */}
      <p className="text-secondary-db-80 max-w-lg my-8 text-xl font-medium">
        Your complete guide to using Waysorted—discover how to set up, manage plugins,
        and optimize your workflow step by step.
      </p>
    </div>
  );
}
