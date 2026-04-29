/**
 * Limits an array to the last N elements
 */
export const limitArray = <T>(arr: T[], limit: number): T[] => {
  return arr.slice(-limit);
};

/**
 * Returns a cryptographically secure random number between 0 (inclusive) and 1 (exclusive).
 */
export const getSecureRandom = (): number => {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return array[0] / (0xffffffff + 1);
};
