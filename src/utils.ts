const SECOND = 1;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / HOUR);
  const minutes = Math.floor((seconds % HOUR) / MINUTE);
  const rest = seconds % MINUTE;

  const stringHours = hours > 0 ? `${hours}h ` : '';
  const stringMinutes = minutes > 0 ? `${minutes}m ` : '';
  const stringSeconds = `${rest}s`;

  return `${stringHours}${stringMinutes}${stringSeconds}`.trim();
}
