/**
 * Security initialization - HTTPS enforcement and security headers.
 * Called once at app startup from main.tsx.
 */
export function initSecurity(): void {
  // 🔒 HTTPS Enforcement: redirect HTTP → HTTPS in production
  if (
    typeof window !== 'undefined' &&
    window.location.protocol === 'http:' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1' &&
    !window.location.hostname.includes('.local')
  ) {
    window.location.replace(
      `https://${window.location.host}${window.location.pathname}${window.location.search}${window.location.hash}`
    );
  }
}
