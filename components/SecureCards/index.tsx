import Image from "next/image";
import Card1 from "./Card1";
import Card2 from "./Card2/index";
import Card3 from "./Card3/index";
import Card4 from "./Card4/index";
import Card5 from "./Card5/index";

export default function SecureCards() {
  return (
    <section className="w-full h-screen flex flex-col items-center  text-center bg-secondary-db-100">
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

      <div className="flex  flex-wrap  h-[455.11px] w-[1034px] justify-end gap-3">
        <div className="flex flex-col h-[455.11px] w-[706.4px] flex-wrap gap-3  justify-end">
          <div className="flex gap-3  flex-wrap items-start justify-end  h-[199.17px] w-[706.4px]">
            <Card1 />
            <Card2 />
          </div>
          <div className="flex gap-3 flex-wrap items-start justify-end h-[241.05px] w-[706.4px]">
            <Card3 />

            <Card4 />
          </div>
        </div>

        <div className=" w-[312.71px] h-[455.11px]">
          <Card5 />
        </div>
      </div>
    </section>
  );
}
