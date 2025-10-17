export function buildQueryString(params?: Record<string, any>): string {
  if (!params) return '';
  return (
    '?' +
    Object.keys(params)
      .filter(k => params[k] !== undefined && params[k] !== null)
      .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(String(params[k]))}`)
      .join('&')
  );
}
