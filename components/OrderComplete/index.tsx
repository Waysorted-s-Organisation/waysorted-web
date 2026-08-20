"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * The screen a customer lands on the moment a payment settles.
 *
 * The receipt is animated out of a slot in the card above it, the way a thermal
 * printer feeds paper. That is not decoration for its own sake: the pause it
 * creates is the moment the customer reads what they were actually charged, and
 * a receipt that simply appeared would be scrolled past. The paper's top edge
 * stays pinned at the slot while the visible height grows downward, which is
 * what a real feed looks like.
 *
 * Everything on the receipt is passed in already formatted. This component
 * renders a record of a payment and must never compute money.
 */
export interface OrderCompleteProps {
  /** Shown as `Order #...`. The Razorpay order or subscription reference. */
  orderNumber: string;
  /** The line item, e.g. "Waysorted Pro". */
  itemName: string;
  /** Pre-formatted line amount, e.g. "$6.00". */
  amount: string;
  /** Pre-formatted total. Separate from `amount` because a discount makes them differ. */
  total?: string;
  /** Rendered above the total when a discount applied, e.g. "BOOST20 (20% off)" / "-$1.20". */
  discountLabel?: string | null;
  discountAmount?: string | null;
  /** Small print under the total, e.g. the recurring price after the first cycle. */
  footnote?: string | null;
  /** Where Home goes. */
  homeHref?: string;
}

/**
 * Width of the paper at full size. Below that the sheet tracks the printer's
 * inner width instead, because paper wider than the machine it came out of
 * destroys the whole illusion - and overflows the viewport.
 */
const RECEIPT_WIDTH = 344;
/** Horizontal padding of the printer card, doubled. Kept here so the two cannot drift. */
const PRINTER_PADDING_X = 44;
const PAPER_WIDTH = `min(${RECEIPT_WIDTH}px, calc(100% - ${PRINTER_PADDING_X}px))`;
const TOOTH_WIDTH = 11.5;
const TOOTH_HEIGHT = 9;

/**
 * The torn bottom edge, as downward-pointing teeth that hang below the paper.
 *
 * Drawn as filled triangles rather than as a notch cut into the paper: the gaps
 * between them are simply the page behind showing through, so it needs no mask
 * and cannot disagree with the background colour.
 */
function TornEdge() {
  const points = useMemo(() => {
    const teeth = Math.ceil(RECEIPT_WIDTH / TOOTH_WIDTH);
    const path: string[] = ["0,0"];
    for (let index = 0; index < teeth; index += 1) {
      const left = index * TOOTH_WIDTH;
      path.push(`${(left + TOOTH_WIDTH / 2).toFixed(2)},${TOOTH_HEIGHT}`);
      path.push(`${(left + TOOTH_WIDTH).toFixed(2)},0`);
    }
    return path.join(" ");
  }, []);

  return (
    <svg
      aria-hidden="true"
      height={TOOTH_HEIGHT}
      viewBox={`0 0 ${RECEIPT_WIDTH} ${TOOTH_HEIGHT}`}
      preserveAspectRatio="none"
      className="block w-full"
    >
      <polygon points={points} fill="#FFFFFF" />
    </svg>
  );
}

function CheckMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="11" fill="#22A75D" />
      <path
        d="M6.4 11.3L9.5 14.4L15.6 8.3"
        stroke="#FFFFFF"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M3.2 8.1L10 2.9l6.8 5.2v8a1.2 1.2 0 0 1-1.2 1.2H4.4a1.2 1.2 0 0 1-1.2-1.2v-8Z"
        stroke="#16171B"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M7.9 17.3v-6h4.2v6" stroke="#16171B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** The square brand mark. The artwork already carries its own dark ground, so only the corners are rounded here. */
function BrandMark() {
  return (
    <Image
      src="/images/way-mark-black.png"
      alt=""
      aria-hidden="true"
      width={41}
      height={41}
      className="h-[41px] w-[41px] rounded-[13px]"
    />
  );
}

export default function OrderComplete({
  orderNumber,
  itemName,
  amount,
  total,
  discountLabel = null,
  discountAmount = null,
  footnote = null,
  homeHref = "/",
}: OrderCompleteProps) {
  const paperRef = useRef<HTMLDivElement | null>(null);
  const [paperHeight, setPaperHeight] = useState(0);
  const [fed, setFed] = useState(false);

  /**
   * The clip animates to an explicit pixel height rather than to `auto`, which
   * is not animatable. The paper is measured after layout and re-measured when
   * it reflows, so a longer receipt - a discount line, a footnote - still feeds
   * all the way out instead of being cut off at a stale height.
   */
  useEffect(() => {
    const paper = paperRef.current;
    if (!paper) return;

    const measure = () => setPaperHeight(paper.getBoundingClientRect().height);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(paper);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!paperHeight) return;
    // One frame after the height is known, so the transition has a 0 -> H change
    // to animate rather than starting already open.
    const timer = window.setTimeout(() => setFed(true), 180);
    return () => window.clearTimeout(timer);
  }, [paperHeight]);

  const reducedMotion =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const clipHeight = fed || reducedMotion ? paperHeight : 0;

  return (
    <div
      className="fixed inset-0 z-[90] overflow-y-auto bg-secondary-db-100"
      style={{
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)",
        backgroundSize: "26px 26px",
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Order complete"
    >
      <div className="mx-auto flex min-h-full w-full max-w-[1120px] flex-col px-5 py-8 sm:px-8">
        {/* `self-start`, or a stretch column blows the mark up to the full width. */}
        <Image
          src="/icons/logo-white.svg"
          alt="Waysorted"
          width={148}
          height={36}
          priority
          className="h-9 w-auto self-start"
        />

        <div className="flex flex-1 flex-col items-center pb-16 pt-10 sm:pt-14">
          <div className="relative w-full max-w-[440px]">
            {/* The printer */}
            <div className="rounded-[24px] bg-[#F1F1F3] px-[22px] pb-[16px] pt-[25px]">
              <div className="flex items-center justify-between">
                <BrandMark />
                <Link
                  href={homeHref}
                  className="inline-flex h-[41px] items-center gap-2 rounded-[12px] bg-white px-[16px] text-[15px] font-medium text-[#16171B] transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.99]"
                >
                  <HomeIcon />
                  Home
                </Link>
              </div>

              <div className="mt-[28px] flex h-[50px] items-center justify-center gap-[8px] rounded-[12px] bg-white">
                <CheckMark />
                <span className="text-[17px] font-medium text-[#16171B]">Order complete</span>
              </div>

              {/* The slot the paper feeds through, exactly as wide as the paper */}
              <div
                aria-hidden="true"
                className="mx-auto mt-[24px] h-[9px] w-full rounded-full bg-[#D8D8DE]"
                style={{ maxWidth: RECEIPT_WIDTH }}
              />
            </div>

            {/*
              Pulled up over the printer's bottom padding so the paper's top edge
              sits at the slot rather than below the card, and raised above it so
              the card's corners stay visible on either side.
            */}
            <div
              className="relative z-10 mx-auto overflow-hidden transition-[height] duration-[1500ms] ease-out motion-reduce:transition-none"
              style={{ width: PAPER_WIDTH, height: clipHeight, marginTop: -16 }}
            >
              <div ref={paperRef} className="w-full font-[family-name:var(--font-roboto-mono)] text-[#16171B]">
                <div className="bg-white px-[18px] pb-[105px] pt-[17px] sm:px-[26px]">
                  <div className="text-[20px] font-bold tracking-[-0.01em]">Waysorted</div>

                  <div className="mt-[8px] flex items-baseline justify-between gap-3 text-[13px] text-[#7A7A80]">
                    <span>Waysorted.com</span>
                    <span className="truncate">Order #{orderNumber}</span>
                  </div>

                  <div className="mt-[58px] flex items-baseline justify-between gap-3 text-[18px]">
                    <span className="truncate">{itemName}</span>
                    <span className="shrink-0">{amount}</span>
                  </div>

                  {discountLabel && discountAmount ? (
                    <div className="mt-[12px] flex items-baseline justify-between gap-3 text-[15px] text-[#22A75D]">
                      <span className="truncate">{discountLabel}</span>
                      <span className="shrink-0">{discountAmount}</span>
                    </div>
                  ) : null}

                  <div
                    aria-hidden="true"
                    className="mt-[20px] h-px w-full"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(to right, #B4B4BA 0 6px, transparent 6px 12px)",
                    }}
                  />

                  <div className="mt-[16px] flex items-baseline justify-between gap-3 text-[20px] font-bold">
                    <span>Total</span>
                    <span className="shrink-0">{total || amount}</span>
                  </div>

                  {footnote ? (
                    <div className="mt-[14px] text-[12px] leading-[1.5] text-[#7A7A80]">{footnote}</div>
                  ) : null}

                  <div className="mt-[40px] text-center text-[15px] text-[#7A7A80]">
                    Thank you for your order !
                  </div>
                </div>
                <TornEdge />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
