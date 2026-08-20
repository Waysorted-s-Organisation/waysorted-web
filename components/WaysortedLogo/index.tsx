import Image from "next/image";

/**
 * The brand lockup used on the checkout and order-complete screens.
 *
 * The square mark followed by "Waysorted" set in the product's own typeface -
 * which is what the designs show. Both screens previously used
 * `/icons/logo-*.svg`, the SCRIPT wordmark, so the page opened with a different
 * logo from the one it was designed with.
 *
 * The mark artwork carries its own dark ground, so it reads on a light or dark
 * page without a variant; only the word changes colour.
 */
export default function WaysortedLogo({
  tone = "dark",
  className = "",
}: {
  /** `dark` for the word on a light page, `light` for a dark one. */
  tone?: "dark" | "light";
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-[10px] ${className}`}>
      <Image
        src="/images/way-mark-black.png"
        alt=""
        aria-hidden="true"
        width={33}
        height={33}
        className="h-[33px] w-[33px] rounded-[10px]"
      />
      <span
        className={`text-[20px] font-semibold tracking-[-0.01em] ${
          tone === "light" ? "text-white" : "text-[#17171C]"
        }`}
      >
        Waysorted
      </span>
    </span>
  );
}
