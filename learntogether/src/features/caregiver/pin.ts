/**
 * The caregiver PIN.
 *
 * This is a "keep the learner out of the settings" guard, not a security
 * boundary: it is stored in plain text on the device, alongside the data it
 * protects. Anyone with the tablet and a debugger can read it. That is an
 * acceptable trade for the MVP, which stores nothing sensitive and has no
 * account to compromise — but it must not be reused if real data is ever
 * synced to a backend.
 */

export const PIN_LENGTH = 4;

export function isValidPinFormat(pin: string): boolean {
  // Deliberately not a constructed RegExp: building the pattern from a template
  // literal needs a doubled backslash, which is easy to get wrong and silently
  // matches nothing.
  return pin.length === PIN_LENGTH && /^[0-9]+$/.test(pin);
}

export function checkPin(entered: string, stored: string | null): boolean {
  // With no PIN set, the caregiver area is open.
  if (stored === null) return true;
  return entered === stored;
}
