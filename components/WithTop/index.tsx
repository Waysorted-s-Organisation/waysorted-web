"use client";

import Image from "next/image";

export default function WithTop() {

    return (
        <section className="w-full flex flex-col items-center justify-center text-center py-40">
            {/* Badge */}
            <span className="inline-flex items-center text-sm font-medium bg-secondary-db-5 text-secondary-db-100 rounded-md mb-4">
                <Image
                    src="/icons/waysorted.svg"
                    alt="With WaySorted"
                    width={30}
                    height={30}
                    className="block p-1"
                />
                <span className="pl-1 pr-2 py-1 text-secondary-db-100">With WaySorted</span>
            </span>


            {/* Heading */}
            <h1 className="text-3xl sm:text-4xl font-semibold text-secondary-db-100 mb-4">
                One Stop Digital Toolkit for Makers
            </h1>
            <div className="max-w-6xl flex flex-1 space-x-50 py-16 items-center justify-center text-center">
                <div>
                    <div className="bg-secondary-db-5 h-16 w-16 p-4 rounded-2xl shadow-sm mx-auto">
                    <Image
                        src="/icons/"
                        alt=""
                        width={30}
                        height={30}
                        className="block p-1"
                    />
                    </div>
                    <p className="text-secondary-db-100 mt-6 text-center text-base font-medium">
                        Launch Way
                    </p>
                </div>
                <div>
                    <div className="bg-secondary-db-5 h-16 w-16 p-4 rounded-2xl shadow-sm mx-auto">
                    <Image
                        src="/icons/"
                        alt=""
                        width={30}
                        height={30}
                        className="block p-1"
                    />
                    </div>
                    <p className="text-secondary-db-100 mt-6 text-center text-base font-medium">
                        Pick your tools
                    </p>
                </div><div>
                    <div className="bg-secondary-db-5 h-16 w-16 p-4 rounded-2xl shadow-sm mx-auto">
                    <Image
                        src="/icons/"
                        alt=""
                        width={30}
                        height={30}
                        className="block p-1"
                    />
                    </div>
                    <p className="text-secondary-db-100 mt-6 text-center text-base font-medium">
                        Bundle them in Wayspace
                    </p>
                </div><div>
                    <div className="bg-secondary-db-5 h-16 w-16 p-4 rounded-2xl shadow-sm mx-auto">
                    <Image
                        src="/icons/"
                        alt=""
                        width={30}
                        height={30}
                        className="block p-1"
                    />
                    </div>
                    <p className="text-secondary-db-100 mt-6 text-center text-base font-medium">
                        Access & work faster
                    </p>
                </div>
            </div>
        </section>
    );
}