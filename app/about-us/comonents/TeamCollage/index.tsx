"use client";

import Image from "next/image";

interface CollageProps {
  images: string[];
}

const Collage: React.FC<CollageProps> = ({ images }) => {
  return (
    <div className="relative hidden md:block w-full max-w-4xl mx-auto h-[500px] bg-white">
        
      {/* Image 1 - Bottom Left */}
      <div className="absolute top-[40%] left-0 bg-[#E7E7E7] button-shadow border-white border-[5px] -translate-y-1/2  overflow-visible z-10">
      <div className="relative">
        <Image
          src={images[0]}
          alt="Collage Image 1"
          width={304}
          height={193}
          className="rounded-lg object-cover"
        />
        <div className="absolute w-[122px] h-[56px] -bottom-5 -left-10 z-50">
            <Image
                src="/icons/awesome-sticker.svg"
                alt="Awesome Sticker"
                fill
                className="object-contain"
            />
        </div>
      </div>
      </div>

      {/* Image 2 - Top Center */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2  bg-[#E7E7E7] button-shadow border-white border-[5px] overflow-visible z-20">
        <div className="relative">
        <Image
          src={images[1]}
          alt="Collage Image 2"
          width={320}
          height={217}
          className="rounded-lg object-cover"
        />
        <div className="absolute w-[140px] h-[70px] top-14 -left-24 z-50">
            <Image
            src="/icons/build-sticker.svg"
            alt="Build Sticker"
            fill
            className="object-contain"
            />
        </div>
        <div className="absolute w-[120px] h-[52px] -top-8 -left-10 z-50">
            <Image
            src="/icons/waydev-sticker.svg"
            alt="Waydev Sticker"
            fill
            className="object-contain"
            />
        </div>
        <div className="absolute w-[120px] h-[55px] top-13 -right-20 z-50">
            <Image
                src="/icons/ambitious-sticker.svg"
                alt="Ambitious Sticker"
                fill
                className="object-contain"
            />
        </div>
        <div className="absolute w-[63px] h-[96px] -bottom-20 left-5 z-50">
            <Image
                src="/icons/joy-sticker.svg"
                alt="Joy Sticker"
                fill
                className="object-contain"
            />
        </div>
        <div className="absolute w-[151px] h-[151px] -bottom-25 right-20 z-50">
            <Image
                src="/icons/geek-sticker.svg"
                alt="Geek Sticker"
                fill
                className="object-contain"
            />
        </div>
        <div className="absolute w-[122px] h-[56px] -bottom-10 -right-15 z-50">
            <Image
                src="/icons/creative-sticker.svg"
                alt="Creative Sticker"
                fill
                className="object-contain"
            />
        </div>
      </div>
      </div>

      {/* Image 3 - Bottom Center */}
      <div className="absolute top-[55%] left-1/2 transform -translate-x-1/2  bg-[#E7E7E7] button-shadow border-white border-[5px] overflow-visible z-10">
      <div className="relative">
        <Image
          src={images[2]}
          alt="Collage Image 3"
          width={304}
          height={193}
          className="rounded-lg object-cover"
        />
        <div className="absolute w-[122px] h-[56px] -bottom-10 -left-10 z-50">
            <Image
                src="/icons/limitless-sticker.svg"
                alt="Limitless Sticker"
                fill
                className="object-contain"
            />
        </div>
        <div className="absolute w-[61px] h-[62px] -bottom-0 -left-6 z-40">
            <Image
                src="/icons/flag-sticker.svg"
                alt="Flag Sticker"
                fill
                className="object-contain"
            />
        </div>
        </div>
      </div>

      {/* Image 4 - Middle Right */}
      <div className="absolute top-[45%] -right-4 transform -translate-y-1/2  bg-[#E7E7E7] button-shadow border-white border-[5px] overflow-visible z-10">
        <div className="relative">
          <Image
            src={images[3]}
            alt="Collage Image 4"
            width={282}
            height={263}
          className="rounded-lg object-cover"
        />
        <div className="absolute w-[137px] h-[87px] -bottom-15 -left-15 z-40">
            <Image
                src="/icons/sorted-sticker.svg"
                alt="Sorted Sticker"
                fill
                className="object-contain"
            />
        </div>
        <div className="absolute w-[120px] h-[55px] -bottom-5 -right-15 z-40">
            <Image
                src="/icons/powerful-sticker.svg"
                alt="Powerful Sticker"
                fill
                className="object-contain"
            />
        </div>
        <div className="absolute w-[145px] h-[86px] -top-7 -right-15 z-40">
            <Image
                src="/icons/bug-sticker.svg"
                alt="Bug Sticker"
                fill
                className="object-contain"
            />
        </div>
        </div>
      </div>
    </div>
  );
};

export default function TeamCollage() {
  const images = [
    "/images/team/img1.jpg",
    "/images/team/img2.jpg",
    "/images/team/img3.jpg",
    "/images/team/img4.jpg",
  ];

  return (
    <section className="py-48 bg-white">
      <Collage
        images={images}
      />
    </section>
  );
}
