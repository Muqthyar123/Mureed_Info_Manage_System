/**
 * Location is derived from the existing Address field (the trailing city
 * segment), so no extra field is stored on a Mureed record.
 */
export function locationFromAddress(address: string): string {
  const parts = address
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length ? (parts[parts.length - 1] as string) : "";
}
