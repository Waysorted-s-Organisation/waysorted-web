import React from "react";

interface Base1Props {
  title: string;
  content: string;
  libero?: string;
}

const Base1: React.FC<Base1Props> = ({ title, content, libero }) => {
  return (
    <div className="absolute bg-gradient-to-t from-[#2A2E34] to-[#28282800] bottom-0 h-55">
      <div className="flex flex-col text-start mt-35 ml-4">
        <div className="flex items-center gap-2 ">
          <svg
            className="w-4 h-8"
            viewBox="0 0 14 17"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M14 2.82902L7 0.508301L8.3769e-06 2.82902V9.05886C-0.00213275 10.4339 0.406222 11.7786 1.17332 12.9226C1.94041 14.0665 3.03171 14.9582 4.30889 15.4847L7 16.6012L9.69111 15.4847C10.9683 14.9582 12.0596 14.0665 12.8267 12.9226C13.5938 11.7786 14.0021 10.4339 14 9.05886V2.82902ZM12.4444 9.05886C12.4463 10.1281 12.129 11.1738 11.5327 12.0634C10.9363 12.9531 10.0879 13.6466 9.09481 14.0561L7 14.9251L4.90519 14.0561C3.91212 13.6466 3.06366 12.9531 2.46733 12.0634C1.87101 11.1738 1.55368 10.1281 1.55556 9.05886V3.94296L7 2.13796L12.4444 3.94296V9.05886Z"
              fill="white"
            />
            <path
              d="M4.69789 7.22201L3.59863 8.31533L5.93196 10.636C6.07768 10.7812 6.27538 10.8628 6.48159 10.863C6.58586 10.8612 6.68871 10.8386 6.78402 10.7965C6.87933 10.7545 6.96516 10.6937 7.03641 10.618L10.9253 6.49227L9.78974 5.43506L6.46344 8.97802L4.69789 7.22201Z"
              fill="white"
            />
          </svg>

          <h1 className="grotesk-font text-white text-md">{title}</h1>
        </div>

        <h3
          className={`grotesk-font text-white/[0.7] text-[12px] left-0 w-full ${libero}`}
        >
          {content}
        </h3>
      </div>
    </div>
  );
};

export default Base1;
