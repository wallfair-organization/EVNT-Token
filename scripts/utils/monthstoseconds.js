/* /scripts/utils/monthtoseconds.js */

export function monthsToSeconds (month) {
  month = parseInt(month); // could be an int or a string
  return (month * 30 * 24 * 60 * 60);
}
