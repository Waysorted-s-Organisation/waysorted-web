"use client";
import Image from "next/image";

export default function FeatureFlex() {
  return (
    <section className="w-full flex justify-center py-10 ">
      <div className="flex flex-col lg:flex-row gap-5">
        {/* LEFT + MIDDLE WRAPPER */}
        <div className="flex flex-col gap-5">
          {/* TOP ROW: Way AI + Wayspace */}
          <div className="flex gap-5">
            {/* LEFT COLUMN */}
            <div className="flex flex-col gap-5">
              {/* Way AI */}
              <div className="w-[346px] h-[163px] p-5 rounded-2xl bg-white shadow border border-gray-100 flex flex-col items-center justify-center text-center">
                <Image
                  src="/icons/way-ai.svg"
                  alt="Way AI"
                  width={40}
                  height={40}
                />
                <h3 className="mt-2 text-lg font-semibold text-gray-900">
                  Way AI
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  Lorem ipsum dolor sit consectetur adipiscing endisse sit amet
                  scelerisque sapien.
                </p>
              </div>

              {/* Play Secure */}
              <div className="w-[346px] h-[290px] p-6 rounded-2xl bg-white shadow border border-gray-100 flex flex-col items-center text-center">
                <Image
                  src="/icons/play-secure.svg"
                  alt="Play Secure"
                  width={60}
                  height={60}
                />
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  Play Easy, Play Secure
                </h3>
                <p className="text-gray-600 text-sm mt-2">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  Aenean eleifend.
                </p>
                <button className="mt-auto bg-black text-white rounded-full px-5 py-2 text-sm font-medium shadow hover:shadow-md transition">
                  Play Challenge
                </button>
              </div>
            </div>

            {/* MIDDLE COLUMN */}
            <div className="w-[346px] h-[467px] p-6 rounded-2xl bg-white shadow border border-gray-100 flex flex-col items-center text-center wayspace-cursor">
              <h3 className="text-xl font-semibold text-gray-900">
                Get Wayspace
              </h3>
              <p className="text-gray-600 text-sm mt-3">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                Suspendisse sit amet.
              </p>
              <div className="mt-5 flex gap-3">
                <div className="w-20 h-20 rounded-xl bg-gray-100" />
                <div className="w-20 h-20 rounded-xl bg-gray-100" />
                <div className="w-20 h-20 rounded-xl bg-gray-100" />
              </div>
            </div>
          </div>

          {/* BOTTOM ROW: Secure Data + Glass Mode */}
          <div className="flex gap-5">
            {/* Secure Data */}
            <div className="w-[191px] h-[210px] p-5 rounded-2xl bg-white shadow border border-gray-100 flex flex-col items-center justify-center text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Secure Data
              </h3>
              <p className="text-gray-600 text-sm">
                Lorem ipsum dolor sit amet consectetur.
              </p>
              <Image
                src="/icons/green-tick.svg"
                alt="Secure Data"
                className="left-0"
                width={50}
                height={50}
              />
              <Image
                src="/icons/tertiary-green-500-tick.svg"
                alt="Secure Data"
                className="left-0"
                width={50}
                height={50}
              />
            </div>

            {/* Glass Mode */}
            <div className="w-[500px] h-[210px] p-6 rounded-2xl bg-white shadow border border-gray-100 flex flex-col justify-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Glass mode on
              </h3>
              <p className="text-gray-600 text-sm mt-3">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                Suspendisse sit amet scelerisque sapien.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-5">
          {/* Focus Section */}
          <div className="w-[277px] h-[591px] p-6 rounded-2xl bg-white shadow border border-gray-100 text-center flex flex-col justify-between">
            <h3 className="text-lg font-bold text-gray-900 leading-snug">
              30% More Focus. <br /> One Unified Toolset.
            </h3>
            <p className="text-gray-600 text-sm mt-3">
              Streamline your workflow with everything you need in one place.
            </p>
          </div>

          {/* CTA */}
          <button className="w-[277px] h-[85px] bg-black text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg font-semibold">
            Start Instantly!
          </button>
        </div>
      </div>
    </section>
  );
}
