/**
 * Limits an array to the last N elements
 */
export const limitArray = <T>(arr: T[], limit: number): T[] => {
  return arr.slice(-limit);
};
