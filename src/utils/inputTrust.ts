/** Synthetic DOM/keyboard events from scripts have isTrusted === false */
export function isTrustedInput(event: Event): boolean {
  return event.isTrusted
}

declare global {
  interface Window {
    __timerIntegrityOk?: () => boolean
  }
}

/** True when setTimeout/setInterval have not been replaced (e.g. speed hacks). */
export function isTimerIntegrityOk(): boolean {
  if (typeof window.__timerIntegrityOk === 'function') {
    return window.__timerIntegrityOk()
  }
  return true
}
