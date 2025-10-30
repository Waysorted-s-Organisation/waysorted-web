import Image from "next/image";
import Link from "next/link";
export default function NotFound() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 error-bg-dots overflow-hidden">
      {/* Top broken wires (you will insert images) */}
      <div className="absolute top-0 left-0">
        <Image src="/icons/wire-top.svg" alt="Wire Left" width={218} height={271} />
      </div>
      <div className="absolute bottom-0 right-0">
        <Image src="/icons/wire-down.svg" alt="Wire Right" width={493} height={345} />
      </div>
      <div className="absolute bottom-0 left-0">
        <Image src="/icons/wire-left.svg" alt="Wire Left" width={200} height={200} />
      </div>
        <div className="absolute top-0 right-20">
        <Image src="/icons/wire-right.svg" alt="Wire Right" width={128} height={461} />
      </div>

      {/* Page content */}
      <div className="z-10 w-3xl">
        <span className="inline-block px-6 py-2 rounded-full bg-primary-way-10 text-primary-way-100 font-semibold text-xl mb-6">
          Page Not Found
        </span>

        <h1 className="text-4xl font-semibold text-primary-way-100 mb-3">
          Oops, This page went on a creative break!
        </h1>

        <p className="text-secondary-db-80 font-medium text-base mb-12 w-2xl mx-auto">
          We couldn&apos;t find the page you were looking for. No worries, you can head
          back to our <Link href="/" className="text-primary-way-100 underline">homepage</Link> to find your way!
        </p>
        <div className="flex justify-center relative">
            <Image src="/icons/laptop-bg.svg" alt="404 Error" width={390} height={336} />
            <div className="absolute inset-0 flex items-center justify-center">
                <Image src="/icons/laptop.svg" alt="404 Error" width={244} height={158} />
            </div>
        </div>
      </div>
    </main>
  );
}
