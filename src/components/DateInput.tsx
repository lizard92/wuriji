import { useEffect, useState } from 'react'
import { buildDateString, splitDateString } from '../utils/dateInput'

interface DateInputProps {
  value: string
  onChange: (value: string) => void
  max?: string
  min?: string
}

export default function DateInput({ value, onChange, max, min }: DateInputProps) {
  const [parts, setParts] = useState(() => splitDateString(value))

  useEffect(() => {
    setParts(splitDateString(value))
  }, [value])

  function handleChange(field: 'year' | 'month' | 'day', raw: string) {
    const cleaned = raw.replace(/\D/g, '')
    const limits = { year: 4, month: 2, day: 2 }
    const next = { ...parts, [field]: cleaned.slice(0, limits[field]) }
    setParts(next)

    const built = buildDateString(next.year, next.month, next.day)
    if (!built) return
    if (max && built > max) return
    if (min && built < min) return
    onChange(built)
  }

  return (
    <div className="date-input">
      <input
        type="text"
        inputMode="numeric"
        placeholder="2025"
        value={parts.year}
        onChange={(e) => handleChange('year', e.target.value)}
        aria-label="年"
      />
      <span className="date-input-unit">年</span>
      <input
        type="text"
        inputMode="numeric"
        placeholder="6"
        value={parts.month}
        onChange={(e) => handleChange('month', e.target.value)}
        aria-label="月"
      />
      <span className="date-input-unit">月</span>
      <input
        type="text"
        inputMode="numeric"
        placeholder="6"
        value={parts.day}
        onChange={(e) => handleChange('day', e.target.value)}
        aria-label="日"
      />
      <span className="date-input-unit">日</span>
    </div>
  )
}
