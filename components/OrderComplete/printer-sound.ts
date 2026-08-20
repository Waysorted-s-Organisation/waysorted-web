/**
 * The sound of a thermal printer feeding paper, synthesised.
 *
 * Synthesised rather than shipped as an audio file so it stays in sync with the
 * feed by construction: the caller passes the same duration the paper takes, and
 * the envelope is built to it. A fixed-length recording would drift the moment a
 * receipt grew a discount line and took longer to print.
 *
 * A real thermal printer is a stepper motor advancing the platen: a low buzz
 * whose pitch is the step rate, with the individual steps audible as a rapid
 * flutter on top, plus paper friction as filtered noise. That is what this
 * builds - one oscillator for the motor, a square LFO for the steps, and a noise
 * buffer for the paper.
 */

export interface PrinterSoundHandle {
  stop: () => void;
}

/**
 * Paper advanced per audible step, in px.
 *
 * The step rate is DERIVED from the feed speed rather than fixed, because a
 * stepper's pitch is its step rate - that is the whole reason a printer sounds
 * the way it does. With a fixed rate the motor buzzed at full speed while the
 * paper crawled, which read as a recording playing over the top of the
 * animation rather than as the thing making it move.
 */
const PX_PER_STEP = 9.5;
/** The motor's own tone, a harmonic of the step rate so the two never beat. */
const MOTOR_HARMONIC = 5;
const PEAK_GAIN = 0.05;
/** Long enough not to click, short enough to feel mechanical. */
const RAMP_S = 0.06;

function createNoiseBuffer(context: AudioContext, seconds: number) {
  const frames = Math.max(1, Math.floor(context.sampleRate * seconds));
  const buffer = context.createBuffer(1, frames, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < frames; index += 1) {
    data[index] = Math.random() * 2 - 1;
  }
  return buffer;
}

/**
 * Starts the feed sound. Returns a handle that stops it early.
 *
 * Returns null, silently, whenever audio is unavailable or blocked - no
 * AudioContext, autoplay policy, a device with no output. A receipt is a record
 * of a payment and must render identically with or without sound, so nothing
 * here is allowed to throw into the caller.
 */
export function playPrinterFeed(options: {
  durationMs: number;
  /** The feed rate the paper is actually animating at. Sets the step rate. */
  pxPerSecond: number;
}): PrinterSoundHandle | null {
  const { durationMs, pxPerSecond } = options;
  if (typeof window === "undefined") return null;

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;

  let context: AudioContext;
  try {
    context = new AudioCtx();
  } catch {
    return null;
  }

  const seconds = Math.max(0.2, durationMs / 1000);
  const stepHz = Math.max(4, pxPerSecond / PX_PER_STEP);
  const motorHz = stepHz * MOTOR_HARMONIC;
  const now = context.currentTime;
  const endsAt = now + seconds;

  const master = context.createGain();
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(PEAK_GAIN, now + RAMP_S);
  master.gain.setValueAtTime(PEAK_GAIN, endsAt - RAMP_S);
  master.gain.linearRampToValueAtTime(0, endsAt);
  master.connect(context.destination);

  // A printer is muffled by its own casing; without this it reads as a synth.
  const tone = context.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.setValueAtTime(Math.max(420, motorHz * 9), now);
  tone.Q.setValueAtTime(0.7, now);
  tone.connect(master);

  const motor = context.createOscillator();
  motor.type = "sawtooth";
  motor.frequency.setValueAtTime(motorHz, now);

  // The steps themselves, chopping the motor tone into a flutter.
  const stepper = context.createOscillator();
  stepper.type = "square";
  stepper.frequency.setValueAtTime(stepHz, now);
  const stepDepth = context.createGain();
  stepDepth.gain.setValueAtTime(0.42, now);
  const motorGain = context.createGain();
  motorGain.gain.setValueAtTime(0.58, now);
  stepper.connect(stepDepth);
  stepDepth.connect(motorGain.gain);
  motor.connect(motorGain);
  motorGain.connect(tone);

  // Paper against the platen.
  const noise = context.createBufferSource();
  noise.buffer = createNoiseBuffer(context, seconds);
  const noiseBand = context.createBiquadFilter();
  noiseBand.type = "bandpass";
  noiseBand.frequency.setValueAtTime(1700, now);
  noiseBand.Q.setValueAtTime(0.9, now);
  const noiseGain = context.createGain();
  noiseGain.gain.setValueAtTime(0.17, now);
  noise.connect(noiseBand);
  noiseBand.connect(noiseGain);
  noiseGain.connect(master);

  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    try {
      const at = context.currentTime;
      master.gain.cancelScheduledValues(at);
      master.gain.setValueAtTime(master.gain.value, at);
      master.gain.linearRampToValueAtTime(0, at + 0.05);
      motor.stop(at + 0.06);
      stepper.stop(at + 0.06);
      noise.stop(at + 0.06);
    } catch {
      // Already stopped.
    }
    // Closing frees the hardware output. Delayed past the fade so the release is
    // heard rather than cut off.
    window.setTimeout(() => void context.close().catch(() => {}), 120);
  };

  try {
    motor.start(now);
    stepper.start(now);
    noise.start(now);
    motor.stop(endsAt);
    stepper.stop(endsAt);
    noise.stop(endsAt);
    window.setTimeout(() => void context.close().catch(() => {}), durationMs + 200);
  } catch {
    stop();
    return null;
  }

  // Autoplay policy suspends a context created without a gesture. The receipt
  // follows a click through a payment sheet, so this usually succeeds; when it
  // does not, the screen is simply silent.
  void context.resume?.().catch(() => {});

  return { stop };
}
