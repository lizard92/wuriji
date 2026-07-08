import { useMemo, useState } from 'react'
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts'
import {
  buildChartData,
  getChartLabel,
  getTimeRangeLabel,
  CHART_COLOR,
  CHART_COLOR_ITEM,
  TIME_RANGE_OPTIONS,
  DEFAULT_TIME_RANGE,
  type ChartDataPoint,
  type ChartView,
  type TimeRange,
} from '../utils/chartData'
import { formatDateDisplay, formatMoney } from '../utils/calculations'
import type { Item } from '../types'

interface CostChartProps {
  items: Item[]
}

interface TooltipEntry {
  value: number
  payload: ChartDataPoint
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string
}) {
  if (!active || !payload?.length) return null

  const dateStr = payload[0].payload.date

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-date">{formatDateDisplay(dateStr)}</div>
      <div className="chart-tooltip-row">
        <span className="chart-tooltip-dot" style={{ background: 'var(--accent)' }} />
        <span className="chart-tooltip-name">{label}</span>
        <span className="chart-tooltip-value">¥{formatMoney(payload[0].value)}/天</span>
      </div>
    </div>
  )
}

export default function CostChart({ items }: CostChartProps) {
  const [view, setView] = useState<ChartView>('total')
  const [timeRange, setTimeRange] = useState<TimeRange>(DEFAULT_TIME_RANGE)

  const data = useMemo(() => buildChartData(items, view, timeRange), [items, view, timeRange])
  const chartLabel = useMemo(() => getChartLabel(items, view), [items, view])
  const rangeLabel = getTimeRangeLabel(timeRange)
  const lineColor = view === 'total' ? CHART_COLOR : CHART_COLOR_ITEM
  const gradientId = view === 'total' ? 'totalGradient' : 'itemGradient'

  if (items.length === 0) return null

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <h2 className="chart-title">成本趋势</h2>
          <p className="chart-subtitle">
            {view === 'total'
              ? `近${rangeLabel}综合日均使用成本变化`
              : `${chartLabel} · 近${rangeLabel}`}
          </p>
        </div>
        <div className="chart-controls">
          <select
            className="chart-select"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
          >
            {TIME_RANGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            className="chart-select"
            value={view}
            onChange={(e) => setView(e.target.value as ChartView)}
          >
            <option value="total">综合成本</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity={0.25} />
                <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3d" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="#8b919e"
              tick={{ fill: '#8b919e', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#2a2f3d' }}
              interval="preserveStartEnd"
              minTickGap={28}
            />
            <YAxis
              stroke="#8b919e"
              tick={{ fill: '#8b919e', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `¥${formatMoney(v)}`}
              width={52}
              domain={['auto', 'auto']}
              allowDataOverflow
            />
            <Tooltip content={<ChartTooltip label={chartLabel} />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="none"
              fill={`url(#${gradientId})`}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="value"
              name={chartLabel}
              stroke={lineColor}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: lineColor, stroke: '#1a1d27', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
