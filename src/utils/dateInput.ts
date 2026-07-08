/** 将 YYYY-MM-DD 拆分为年月日 */
export function splitDateString(dateStr: string): {
  year: string
  month: string
  day: string
} {
  const [year = '', month = '', day = ''] = dateStr.split('-')
  return { year, month, day }
}

/** 年月日合并为 YYYY-MM-DD，无效则返回 null */
export function buildDateString(year: string, month: string, day: string): string | null {
  const y = parseInt(year, 10)
  const m = parseInt(month, 10)
  const d = parseInt(day, 10)
  if (!year || !month || !day || !y || !m || !d) return null
  if (m < 1 || m > 12 || d < 1 || d > 31) return null

  const date = new Date(y, m - 1, d)
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null
  }

  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export function todayString(): string {
  return new Date().toISOString().slice(0, 10)
}
