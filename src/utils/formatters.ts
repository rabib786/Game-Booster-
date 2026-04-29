/**
 * Formats memory value (MB) into a readable string (GB or MB)
 */
export const formatMemory = (mb: number): string => {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(2)} GB`;
  }
  return `${mb.toFixed(1)} MB`;
};

/**
 * Formats an ISO string or Date object to a localized time string
 */
export const formatTime = (
  date: string | Date,
  timeWindow: 'Live' | '5m' | '1h' | '24h' = 'Live'
): string => {
  const d = new Date(date);
  if (timeWindow === '24h') {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};
