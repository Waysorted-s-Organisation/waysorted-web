import Image from "next/image";
import Card1 from "./Card1";
import Card2 from "./Card2/index";
import Card3 from "./Card3/index";
import Card4 from "./Card4/index";
import Card5 from "./Card5/index";

export default function SecureCards() {
  return (
    <section className="w-full h-screen flex flex-col items-center  text-center bg-[#1E1E1E]">
      {/* Badge */}
      <span className="inline-flex mt-[67px] py-1 pl-1 pr-2 items-center text-sm font-medium bg-[#F3F3F3] text-[#0D1218] rounded-md mb-4">
        <Image
          src="/icons/secure-lock.svg"
          alt="Our Impact"
          width={24}
          height={24}
          className="block"
        />
        <span className="px-3 py-1">Security</span>
      </span>

      {/* Heading */}
      <h1 className="text-3xl   font-semibold  mb-4 bg-gradient-to-b from-white to-[#828282] bg-clip-text text-transparent">
        We keep your data secure
      </h1>

      {/* Description */}
      <p className="max-w-6xl  text-base  leading-relaxed mb-6 bg-[linear-gradient(to_bottom,#FFF_0%,#A8A8A8_48%,#F1F1F1_100%)] bg-clip-text text-transparent">
        Waysorted keeps your data confidential & safe. Only you have access to
        your work. We have no control, <br /> nor do we want any.
      </p>

      <div className="relative grid grid-cols-18 grid-rows-10 gap-2 w-full h-full">
        <div className="absolute flex row-start-1 row-end-5 col-start-4 col-end-8 items-end justify-start left-30">
          <Card1 />
        </div>

        {/* Card 2 */}
        <div className="flex row-start-1 row-end-5 col-start-8 col-end-13 items-end justify-start absolute left-0 ">
          <Card2 />
        </div>

        {/* Card 5 - spans both rows */}
        <div className="absolute row-start-1 row-end-10 col-start-13 col-end-19  flex justify-start items-center -left-28 top-57">
          <Card5 />
        </div>

        {/* Card 3 */}
        <div className=" absolute flex row-start-5 row-end-10 col-start-4 col-end-9  items-center justify-start top-22 left-30">
          <Card3 />
        </div>

        {/* Card 4 */}
        <div className="absolute flex row-start-5 row-end-10 col-start-9 col-end-14  justify-start items-end top-52 -left-12">
          <Card4 />
        </div>
      </div>
    </section>
  );
}
