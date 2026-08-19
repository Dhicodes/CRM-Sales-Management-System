// True if the given date string falls on today or later (local server day).
function isTodayOrFuture(value) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return new Date(value) >= startOfToday;
}

module.exports = { isTodayOrFuture };
