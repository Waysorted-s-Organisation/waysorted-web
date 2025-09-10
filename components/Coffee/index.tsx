"use client";

import Image from "next/image";

export default function ImpactTop() {

    return (
        <section className="w-full flex flex-col py-40 items-center justify-center text-center">


            {/* Heading */}
            <h1 className="text-5xl sm:text-4xl font-semibold text-secondary-db-100 mb-4">
                Sort it before
                <span className="shake-hover">
                    <Image
                        src="/icons/coffee.svg"
                        alt="Coffee"
                        width={60}
                        height={60}
                        className="inline-block mx-2 cursor-pointer"
                    />
                    
                </span>
                Coffee’s Ready!
            </h1>

            {/* Button */}
            <div className="flex flex-col items-center py-16 space-y-2">
                <button
                    className="bg-secondary-db-100 text-white rounded-2xl text-lg font-semibold px-4 py-3 flex items-center cursor-pointer"
                    title="Try Now"
                >
                    <span>It’s Free - Try now!</span>
                    <span
                        className="ml-4 bg-white h-14 w-14 flex items-center justify-center rounded-xl"
                        aria-hidden="true"
                    >
                        <Image
                            src="/icons/rocket.svg"
                            alt="Launch"
                            width={30}
                            height={30}
                            className="inline-block"
                        />
                    </span>
                </button>
                <p className="text-secondary-db-60 font-regular text-sm">No credit card required.</p>
            </div>

            
        </section>
    );
}