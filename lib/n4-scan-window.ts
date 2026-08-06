const DAY_MS = 24 * 60 * 60 * 1000;

export function getN4ScanWindow(input: {
  now: Date;
  producerStartedAt: Date;
  inactivityDays: number;
  lookbackHours: number;
}) {
  const cutoff = new Date(
    input.now.getTime() - input.inactivityDays * DAY_MS,
  );
  const rollingLowerBound = new Date(
    cutoff.getTime() - input.lookbackHours * 60 * 60 * 1000,
  );
  const launchLowerBound = new Date(
    input.producerStartedAt.getTime() - input.inactivityDays * DAY_MS,
  );
  return {
    cutoff,
    lowerBound: new Date(Math.max(
      rollingLowerBound.getTime(),
      launchLowerBound.getTime(),
    )),
  };
}
