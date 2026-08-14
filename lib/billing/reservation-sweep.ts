/**
 * Selection rules for reclaiming stale credit holds.
 *
 * Kept free of server-only imports so the rules can be exercised directly in tests: this decides
 * whether a paying customer's stranded credits are returned to them, and whether a live job is
 * billed or silently freed. Both directions cost real money.
 */

/**
 * Absolute age past which a credit hold is reclaimed even if a processor claimed it.
 *
 * recordProcessorReservationStatus extends `expiresAt` on every accept, so a processor that accepts
 * a job and then crashes would otherwise strand the customer's credits permanently - previously
 * guaranteed by excluding `metadata.processorStatus: "accepted"` from the sweep entirely.
 */
export const RESERVATION_HARD_RECLAIM_MS = 2 * 60 * 60_000;

export function buildStaleReservationFilter(input: {
  now: Date;
  userId?: string | null;
  hardReclaimMs?: number;
}) {
  const hardReclaimCutoff = new Date(
    input.now.getTime() - (input.hardReclaimMs ?? RESERVATION_HARD_RECLAIM_MS),
  );
  return {
    status: "reserved",
    ...(input.userId ? { user: input.userId } : {}),
    // Both branches require a LAPSED lease. A processor that is genuinely still working keeps
    // pushing expiresAt forward, so an in-flight job is never reclaimed out from under it.
    expiresAt: { $lte: input.now },
    $or: [
      // Lapsed hold that no processor ever claimed.
      { "metadata.processorStatus": { $ne: "accepted" } },
      // Claimed, lease lapsed anyway, and older than any plausible job duration.
      { createdAt: { $lte: hardReclaimCutoff } },
    ],
  };
}
