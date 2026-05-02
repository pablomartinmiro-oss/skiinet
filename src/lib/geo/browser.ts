/**
 * Best-effort geolocation capture for fichaje.
 * Returns null on denial, timeout, or unsupported browsers — never throws.
 */
export async function getCurrentCoords(timeoutMs = 6000): Promise<
  { lat: number; lon: number } | null
> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;

  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), timeoutMs);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 60_000 }
    );
  });
}
