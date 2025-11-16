/**
 * Returns a date string in the format `YYYY-MM-DD`.
 * @param {Date} [date] - The date to format. If not provided, the current date is used.
 * @returns {string} The formatted date string.
 */
export const getDateString = (date?: Date): string =>
  (date ?? new Date()).toISOString().replace(/T.*$/, '');
