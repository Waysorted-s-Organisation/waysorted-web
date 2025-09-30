"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";

type Ball = {
  x: number;
  y: number;
  r: number;   // radius in CSS px
  vy: number;  // vertical speed
  spin: number; // radians/sec
  rot: number; // current rotation radians
  id: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

const EDGE_PAD = 6; // visual padding from track ends

// Your provided SVG, used as the sprite
const BALL_SVG = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M20.2606 27.4533C16.9631 29.0457 11.9354 28.5588 11.0039 27.5074L10.2922 27.2111C8.41446 27.044 4.58088 23.3962 3.77316 20.4894L3.56579 19.9614C2.45317 17.617 2.39338 12.4789 3.77921 10.6621L3.98203 10.2001C4.42665 7.7729 8.5026 4.14289 10.6955 3.77861L10.6964 3.77823C10.6955 3.77861 11.2317 3.57017 11.2317 3.57017C13.9115 2.09159 19.3139 2.75832 20.729 3.90832L21.3228 4.18929C23.1771 4.75141 27.0385 8.52247 27.4519 10.9346L27.4522 10.9356C27.5399 11.1603 27.5954 11.3977 27.6957 11.6154C28.9277 14.29 28.4971 18.5919 27.418 20.3096L27.2231 20.775C26.9363 22.979 22.7282 27.0131 20.9965 27.1323L20.2606 27.4533Z" fill="#FC822B"/>
<path d="M11.0036 27.507C10.7637 27.4162 10.5263 27.3179 10.292 27.2107C12.9821 26.4687 15.3291 23.4586 18.3149 16.9322C18.3577 16.8372 18.4024 16.7415 18.4457 16.6451C18.4716 16.5871 18.4979 16.5301 18.5229 16.4725C21.5954 9.61887 21.2358 5.67631 20.7287 3.90811C20.9285 3.9963 21.127 4.08947 21.3225 4.18908C22.2779 8.31312 20.3301 13.6701 18.987 16.6723C18.9598 16.7352 18.9323 16.7949 18.9058 16.8542C18.8635 16.9479 18.821 17.0407 18.7793 17.133C15.8914 23.4482 13.636 26.484 11.0036 27.507Z" fill="#263238"/>
<path d="M27.2222 20.7753L21.772 18.4238L21.3066 18.2234L18.7787 17.1336L18.3142 16.9328L15.2266 15.6017L14.7617 15.4L3.77822 10.6624C3.84265 10.5067 3.91003 10.3532 3.98105 10.2003L14.9698 14.9402L15.4343 15.141L18.5223 16.473L18.9864 16.6728L21.4649 17.7419L21.9294 17.9427L27.4172 20.3098C27.3564 20.4662 27.2906 20.6213 27.2222 20.7753Z" fill="#263238"/>
<path d="M10.0868 19.5147C7.97425 20.2739 5.52376 20.625 3.77299 20.4893C3.69954 20.3144 3.62984 20.1378 3.56562 19.9613C5.14632 20.1337 7.60929 19.8688 9.91648 19.0394C11.6004 18.4342 13.7748 17.3175 14.7625 15.3997C14.8021 15.3244 14.8389 15.2469 14.8743 15.1689C14.9071 15.0952 14.9391 15.0196 14.9705 14.9399C15.5016 13.5886 15.7166 11.3681 14.0648 8.16267C13.0517 6.19596 11.653 4.53335 10.6963 3.77821C10.8728 3.70307 11.051 3.63489 11.2316 3.57015C12.225 4.43452 13.5463 6.05499 14.5129 7.93154C16.2562 11.3136 16.0096 13.6876 15.4352 15.1407C15.4022 15.222 15.3694 15.3012 15.3352 15.3766C15.3024 15.4502 15.2659 15.5254 15.2275 15.6013C14.6145 16.8058 13.2255 18.3862 10.0868 19.5147Z" fill="#263238"/>
<path d="M20.26 27.4532C20.4401 27.1727 20.6704 26.7226 20.7176 26.1907C20.7733 25.5566 20.6766 24.8472 20.5828 24.1615C20.5127 23.6542 20.441 23.1291 20.4288 22.6282C20.4007 21.463 20.3928 21.0939 21.307 18.223C21.329 18.1525 21.3522 18.0793 21.376 18.0049C21.4047 17.9154 21.4341 17.8278 21.4652 17.7417C22.3645 15.2674 24.403 13.8505 25.5149 13.0773C25.733 12.926 25.9218 12.794 26.0619 12.6844C26.7994 12.1036 27.1797 11.6376 27.4517 10.9355C27.5393 11.1603 27.6213 11.3873 27.6951 11.6153C27.4037 12.1525 27.003 12.5862 26.3747 13.0807C26.2223 13.2006 26.0282 13.3357 25.8024 13.4922C24.6578 14.287 22.7654 15.6039 21.9297 17.9424C21.9048 18.0141 21.8799 18.0857 21.8567 18.1589C21.8275 18.2497 21.7993 18.3378 21.7723 18.4234C20.8985 21.1687 20.9059 21.4924 20.9332 22.6058C20.9451 23.0894 21.015 23.599 21.0817 24.0925C21.1803 24.8066 21.2804 25.5441 21.2201 26.2352C21.1909 26.568 21.1035 26.8716 20.9959 27.1322C20.7534 27.2487 20.5075 27.3544 20.26 27.4532Z" fill="#263238"/>
<path opacity="0.2" d="M16.4067 4.07281C16.9442 2.72183 23.358 5.51188 24.482 7.36319C25.5118 9.05928 22.1295 9.68702 20.2574 9.17721C18.7437 8.76495 15.7789 5.65104 16.4067 4.07281Z" fill="white"/>
</svg>`;

function svgDataUrl(svg: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export default function PlaySecureCard() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const [isDemo, setIsDemo] = useState(false);

  // Button position (left is CENTER because of -translate-x-1/2)
  const [btnX, setBtnX] = useState(0);
  const [btnY, setBtnY] = useState(0);
  const btnXRef = useRef(0);

  // Animation
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const lastPointerMsRef = useRef<number>(0);
  const targetXRef = useRef<number>(0);
  const elapsedMsRef = useRef<number>(0);

  // Metrics
  const metricsRef = useRef({
    cw: 0,
    ch: 0,
    trackLeft: 0,
    trackTop: 0,
    trackRight: 0,
    trackBottom: 0,
    trackWidth: 0,
    trackHeight: 0,
    halfBtnW: 40,
    btnH: 36,
  });

  // Sprite image for ball
  const ballImgRef = useRef<HTMLImageElement | null>(null);
  const ballReadyRef = useRef(false);

  // Balls
  const ballsRef = useRef<Ball[]>([]);
  const spawnTimerRef = useRef<number>(0);
  const spawnIntervalRef = useRef<number>(650);
  const idCounterRef = useRef(0);

  // Canvas DPR/size
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });

  // Load the SVG sprite once
  useEffect(() => {
    const img = new window.Image();
    img.width = 32;
    img.height = 32;
    img.decoding = "async";
    img.src = svgDataUrl(BALL_SVG);
    img.onload = () => {
      ballImgRef.current = img;
      ballReadyRef.current = true;
    };
    img.onerror = () => {
      console.warn("Failed to load basketball SVG sprite");
    };
  }, []);

  const updateContainerAndTrackMetrics = () => {
    const container = containerRef.current;
    const track = trackRef.current;
    const btn = buttonRef.current;
    if (!container || !track || !btn) return;

    const cRect = container.getBoundingClientRect();
    const tRect = track.getBoundingClientRect();

    metricsRef.current.cw = cRect.width;
    metricsRef.current.ch = cRect.height;
    metricsRef.current.trackLeft = tRect.left - cRect.left;
    metricsRef.current.trackTop = tRect.top - cRect.top;
    metricsRef.current.trackRight = tRect.right - cRect.left;
    metricsRef.current.trackBottom = tRect.bottom - cRect.top;
    metricsRef.current.trackWidth = tRect.width;
    metricsRef.current.trackHeight = tRect.height;
    metricsRef.current.btnH = btn.offsetHeight || 36;
  };

  const resizeCanvas = () => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const rect = container.getBoundingClientRect();
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    sizeRef.current = { w: rect.width, h: rect.height, dpr };

    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  useEffect(() => {
    resizeCanvas();
    updateContainerAndTrackMetrics();

    const roContainer = new ResizeObserver(() => {
      resizeCanvas();
      updateContainerAndTrackMetrics();
    });
    if (containerRef.current) roContainer.observe(containerRef.current);

    // Keep button width up to date (used for clamping)
    const roButton = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.round(entry.contentRect.width);
        if (w > 0) metricsRef.current.halfBtnW = w / 2;
      }
    });
    if (buttonRef.current) roButton.observe(buttonRef.current);

    return () => {
      roContainer.disconnect();
      roButton.disconnect();
    };
  }, []);

  const startDemo = () => {
    ballsRef.current = [];
    spawnTimerRef.current = 0;
    spawnIntervalRef.current = 650;
    idCounterRef.current = 0;
    elapsedMsRef.current = 0;

    updateContainerAndTrackMetrics();

    // Measure current button width immediately (for correct clamp)
    if (buttonRef.current) {
      const w = Math.round(buttonRef.current.offsetWidth);
      if (w > 0) metricsRef.current.halfBtnW = w / 2;
    }

    const { trackLeft, trackWidth, btnH, trackTop, trackHeight } = metricsRef.current;
    const startCenter = trackLeft + trackWidth / 2;
    setBtnX(startCenter);
    btnXRef.current = startCenter;

    // Lock Y to the center of the track
    setBtnY(trackTop + trackHeight / 2 - btnH / 2);

    targetXRef.current = startCenter;
    lastPointerMsRef.current = performance.now();

    setIsDemo(true);
    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(loop);
  };

  const stopDemo = () => {
    setIsDemo(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  // Pointer: only horizontal follow inside the track (clamp the CENTER)
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDemo || !containerRef.current) return;

    const cRect = containerRef.current.getBoundingClientRect();
    const localX = e.clientX - cRect.left;

    const { trackLeft, trackRight, halfBtnW } = metricsRef.current;
    const minCenter = trackLeft + halfBtnW + EDGE_PAD;
    const maxCenter = trackRight - halfBtnW - EDGE_PAD;

    targetXRef.current = clamp(localX, minCenter, maxCenter);
    lastPointerMsRef.current = performance.now();
  };

  const loop = (now: number) => {
    const dt = Math.min(0.04, (now - lastTimeRef.current) / 1000);
    lastTimeRef.current = now;
    elapsedMsRef.current += dt * 1000;

    update(dt, now);
    draw();

    rafRef.current = requestAnimationFrame(loop);
  };

  const spawnBall = () => {
    const { w } = sizeRef.current;
    const r = 10 + Math.random() * 12; // radius
    const margin = r + 8;
    const x = margin + Math.random() * (w - margin * 2);
    const y = -r - 6;
    const vy = 140 + Math.random() * 160;
    const spin = (Math.random() - 0.5) * 4;
    const rot = Math.random() * Math.PI * 2;
    ballsRef.current.push({ x, y, r, vy, spin, rot, id: idCounterRef.current++ });
  };

  const update = (dt: number, now: number) => {
    // Refresh layout metrics (width cached by observer)
    updateContainerAndTrackMetrics();

    // Spawn cadence
    spawnTimerRef.current += dt * 1000;
    if (spawnTimerRef.current >= spawnIntervalRef.current) {
      spawnTimerRef.current = 0;
      spawnBall();
      spawnIntervalRef.current = Math.max(420, spawnIntervalRef.current - 2.5);
    }

    // Move balls
    const kept: Ball[] = [];
    const { h } = sizeRef.current;
    for (const b of ballsRef.current) {
      b.y += b.vy * dt;
      b.rot += b.spin * dt;
      if (b.y - b.r <= h + 20) kept.push(b);
    }
    ballsRef.current = kept;

    // Button motion (ease center X toward target; auto-oscillate when idle)
    const m = metricsRef.current;
    const minCenter = m.trackLeft + m.halfBtnW + EDGE_PAD;
    const maxCenter = m.trackRight - m.halfBtnW - EDGE_PAD;

    let targetX = targetXRef.current;

    // Idle sweep stays within [-radius, +radius] around center
    if (now - lastPointerMsRef.current > 900) {
      const center = m.trackLeft + m.trackWidth / 2;
      const radius = Math.max(0, m.trackWidth / 2 - m.halfBtnW - EDGE_PAD);
      const t = elapsedMsRef.current / 1000;
      targetX = center + radius * Math.sin(t * 1.1);
    }

    // Ease then clamp to be extra safe against any drift
    const currentX = btnXRef.current;
    const easedX = currentX + (targetX - currentX) * Math.min(1, dt * 12);
    const clampedX = clamp(easedX, minCenter, maxCenter);

    if (Math.abs(clampedX - btnXRef.current) > 0.1) {
      btnXRef.current = clampedX;
      setBtnX(clampedX);
    }

    // Y locked to track center
    const yLocked = m.trackTop + m.trackHeight / 2 - m.btnH / 2;
    setBtnY(yLocked);
  };

  // Draw one ball using the SVG sprite (rotated and scaled)
  const drawBall = (ctx: CanvasRenderingContext2D, b: Ball) => {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.rot);

    const size = b.r * 2; // scale sprite so 32x32 maps to desired radius
    if (ballReadyRef.current && ballImgRef.current) {
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(ballImgRef.current, -size / 2, -size / 2, size, size);
    } else {
      // Fallback: simple circle if sprite not ready yet
      ctx.fillStyle = "#F97316";
      ctx.beginPath();
      ctx.arc(0, 0, b.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { w, h } = sizeRef.current;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Dotted backdrop
    ctx.save();
    ctx.strokeStyle = "rgba(17,24,39,0.08)";
    ctx.lineWidth = 1;
    const step = 18;
    for (let y = step / 2; y < h; y += step) {
      for (let x = step / 2; x < w; x += step) {
        ctx.beginPath();
        ctx.arc(x, y, 0.6, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();

    // Balls
    for (const b of ballsRef.current) drawBall(ctx, b);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-[346px] h-[290px] p-6 rounded-2xl shadow border border-gray-100 flex flex-col items-center text-center overflow-hidden white-bg-dots"
      onMouseMove={onMouseMove}
    >
      {/* Canvas for dots and falling basketballs */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none rounded-2xl" aria-hidden="true" />

      {/* Content hides during demo */}
      {!isDemo && (
        <>
          <Image src="/icons/play-secure.svg" alt="Play Secure" width={60} height={60} />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">Play Easy, Play Secure</h3>
          <p className="text-gray-600 text-sm mt-2">
            Take a breather and sharpen your reflexes! In this minimalist arcade-style demo.
          </p>
        </>
      )}

      {/* Bottom track */}
      <div
        ref={trackRef}
        className="absolute left-4 right-4 bottom-4 h-12 rounded-full bg-indigo-50/80 backdrop-blur-[1px] pointer-events-none"
        role="presentation"
        aria-hidden="true"
      />

      {/* Button that follows cursor horizontally on the track */}
      <button
        ref={buttonRef}
        title="Start the Play Secure demo"
        aria-label="Start the Play Secure demo"
        onClick={() => {
          if (!isDemo) startDemo();
        }}
        className={`bg-black text-white rounded-full px-6 py-2 text-sm font-medium shadow transition focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40 whitespace-nowrap min-w-[160px] ${
          isDemo ? "absolute -translate-x-1/2 z-10" : "mt-auto z-10"
        }`}
        style={
          isDemo
            ? {
                left: btnX, // center X (because of -translate-x-1/2)
                top: btnY,
              }
            : undefined
        }
      >
        Play Challenge
      </button>

      {isDemo && (
        <button
          onClick={stopDemo}
          className="absolute top-2 right-2 text-[10px] font-semibold text-gray-600 bg-white/80 backdrop-blur px-2 py-1 rounded-full shadow-sm z-20"
        >
          Stop
        </button>
      )}
    </div>
  );
}