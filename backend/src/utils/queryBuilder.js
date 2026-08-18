function buildPagination(query) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function buildSort(query, allowedFields, defaultSort) {
  const raw = query.sort || defaultSort;
  const fields = raw
    .split(',')
    .map((f) => f.trim())
    .filter((f) => allowedFields.includes(f.replace(/^-/, '')));
  return fields.length ? fields.join(' ') : defaultSort;
}

function buildDateRangeFilter(field, dateFrom, dateTo) {
  const range = {};
  if (dateFrom) range.$gte = new Date(dateFrom);
  if (dateTo) range.$lte = new Date(dateTo);
  return Object.keys(range).length ? { [field]: range } : null;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { buildPagination, buildSort, buildDateRangeFilter, escapeRegex };
