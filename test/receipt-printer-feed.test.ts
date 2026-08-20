/**
 * The receipt feed, and the sound that has to stay glued to it.
 *
 * The paper advances at a constant rate, so a longer receipt genuinely takes
 * longer to print. Both the animation duration and the motor pitch are derived
 * from that one rate - if they are ever set independently, the sound drifts off
 * the picture and reads as a recording playing over the top.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const read = (file: string) => readFileSync(path.join(process.cwd(), file), "utf8");

const component = read("components/OrderComplete/index.tsx");
const sound = read("components/OrderComplete/printer-sound.ts");

test("the feed duration comes from the paper height, not a constant", () => {
  // A fixed duration makes a long receipt appear to accelerate, and desyncs the
  // sound, which is built to the duration it is handed.
  assert.match(component, /FEED_PX_PER_SECOND/);
  assert.match(component, /paperHeight \/ FEED_PX_PER_SECOND/);
});

test("the paper moves at a constant rate", () => {
  // A stepper motor does not accelerate. An ease made the paper pull away from
  // its own sound.
  assert.match(component, /height \$\{feedMs\}ms linear/);
  assert.doesNotMatch(component, /duration-\[1500ms\] ease-out/);
});

test("the sound is handed the same rate the paper moves at", () => {
  assert.match(component, /playPrinterFeed\(\{ durationMs: feedMs, pxPerSecond: FEED_PX_PER_SECOND \}\)/);
  assert.match(sound, /pxPerSecond \/ PX_PER_STEP/, "the step rate must be derived, not fixed");
  assert.doesNotMatch(sound, /const STEP_HZ = /, "a fixed step rate desyncs from the feed");
});

test("the motor tone is a harmonic of the step rate", () => {
  // Otherwise the two beat against each other and it stops sounding mechanical.
  assert.match(sound, /stepHz \* MOTOR_HARMONIC/);
});

test("reduced motion silences the sound as well as the movement", () => {
  // Someone who asked for less movement has not asked for a noise instead.
  assert.match(component, /if \(!fed \|\| reducedMotion \|\| muted/);
});

test("the sound can be refused, and a refused sound can be replayed", () => {
  assert.match(component, /toggleMute/);
  assert.match(component, /aria-pressed=\{soundBlocked \? false : muted\}/);

  // A browser refuses audio when no user gesture reached it, and the receipt is
  // created long after the click that paid for it. When that happens the control
  // becomes a replay rather than a mute - pressing it IS the gesture - and the
  // paper is rewound so the motor starts with it. Resuming a sound partway
  // through a finished animation is exactly the desync this avoids.
  assert.match(component, /soundBlocked/);
  assert.match(component, /setFed\(false\)/, "a replay must rewind the paper, not just restart audio");
  assert.match(component, /unlockPrinterAudio\(\)/);
});

test("audio is unlocked from a real user gesture", () => {
  // An AudioContext created outside a gesture starts SUSPENDED and resume() is
  // refused, so the printer was silent. The checkout button's own click handler
  // is the one place a gesture is guaranteed.
  const checkout = read("app/billing/billing-client.tsx");
  assert.match(checkout, /unlockPrinterAudio\(\);/);
  assert.match(sound, /export function unlockPrinterAudio/);
  assert.match(sound, /if \(context\.state !== "running"\) return null;/);
});

test("audio can never break the receipt", () => {
  // A receipt is a record of a payment. It must render identically with or
  // without sound, so every audio failure path returns rather than throws.
  assert.match(sound, /if \(!AudioCtx\) return null;/);
  assert.match(sound, /catch \{\s*return null;\s*\}/);
  assert.match(sound, /context\.resume\?\.\(\)\.catch/);
});
