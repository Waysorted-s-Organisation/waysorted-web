"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";

type TopBannerProps = {
    earlyAccess: boolean;
};

export default function TopBanner({ earlyAccess }: TopBannerProps) {
    const router = useRouter();
    return (
        <div className="top-banner">
            {!earlyAccess && (
                <div className="mx-auto flex max-w-screen items-start sm:items-center justify-between gap-4 px-4 py-3 sm:px-6 bg-primary-way-10 flex-col sm:flex-row">
                    <div className="flex items-center gap-3">
                        <span
                            aria-hidden="true"
                            className="inline-flex w-6 h-6 sm:w-4 sm:h-4 items-center justify-center cursor-pointer relative min-w-[20px] min-h-[20px]"
                            title="Info"
                        >
                            <Image
                                src="/icons/bolt-blue.svg"
                                alt="Info"
                                fill
                                className="object-contain"
                                sizes="20px"
                            />
                        </span>
                        <p className="text-sm font-medium text-primary-way-100">
                            You don&apos;t have any active Subscription!
                        </p>
                    </div>


                </div>

            )}
        </div>
    );
}
