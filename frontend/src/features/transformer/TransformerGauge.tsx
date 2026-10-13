/**
 * TransformerGauge — ECharts gauge chart showing kVA load vs limit.
 * Severity colours: green < warn < amber < crit < red.
 * Lazy-loads ECharts via useECharts hook.
 */
import React, { useMemo } from 'react'
import { useECharts } from '@/hooks/useECharts'

export interface TransformerGaugeProps {
  peakPct?: number         // current load as % of transformer rating (0–100)
  data?: {
    loading_percent?: number
    current_load_pct?: number
    rating_kva?: number
  }
  warnThreshold?: number  // default 80
  critThreshold?: number  // default 90
  label?: string
  kva?: number
  height?: number
}

function getSeverityColor(pct: number, warn: number, crit: number): string {
  if (pct >= crit) return '#ef4444'
  if (pct >= warn) return '#f59e0b'
  return '#10b981'
}

export const TransformerGauge = React.memo(function TransformerGauge({
  peakPct,
  data,
  warnThreshold = 80,
  critThreshold = 90,
  label = 'Transformer Load',
  kva,
  height = 260,
}: TransformerGaugeProps) {
  const measuredPct = peakPct ?? data?.loading_percent ?? data?.current_load_pct
  const effectivePct = measuredPct ?? 0
  const effectiveKva = kva ?? data?.rating_kva
  const maxGauge = Math.max(100, Math.ceil(effectivePct / 20) * 20)
  const pct = Math.max(0, effectivePct)
  const color = getSeverityColor(effectivePct, warnThreshold, critThreshold)

  const option = useMemo(() => measuredPct == null ? null : ({
    backgroundColor: 'transparent',
    animation: true,
    series: [
      {
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: maxGauge,
        radius: '88%',
        center: ['50%', '62%'],
        splitNumber: 5,
        // Track (background arc)
        progress: {
          show: true,
          width: 18,
          itemStyle: { color },
        },
        axisLine: {
          lineStyle: {
            width: 18,
            color: [
              [Math.min(1, warnThreshold / maxGauge), 'rgba(16, 185, 129, 0.25)'],
              [Math.min(1, critThreshold / maxGauge), 'rgba(245, 158, 11, 0.25)'],
              [1, 'rgba(239, 68, 68, 0.25)'],
            ],
          },
        },
        axisTick: { show: false },
        splitLine: {
          length: 10,
          lineStyle: { color: '#23525d', width: 2 },
        },
        axisLabel: {
          distance: 28,
          color: '#9bb7bc',
          fontSize: 12,
          formatter: '{value}%',
        },
        pointer: {
          show: true,
          length: '65%',
          width: 6,
          offsetCenter: [0, '5%'],
          itemStyle: { color: '#e2f1f3' },
        },
        anchor: {
          show: true,
          showAbove: false,
          size: 16,
          itemStyle: {
            borderWidth: 3,
            borderColor: '#1e88e5',
            color: '#0a1f24',
          },
        },
        detail: {
          valueAnimation: true,
          offsetCenter: [0, '32%'],
          fontSize: 32,
          fontWeight: 700,
          color,
          formatter: '{value}%',
          fontFamily: 'JetBrains Mono, monospace',
        },
        data: [
          {
            value: Math.round(pct * 10) / 10,
          },
        ],
      },
    ],
  }), [measuredPct, pct, maxGauge, color, warnThreshold, critThreshold])

  const ref = useECharts(option)

  return (
    <div
      role={measuredPct == null ? undefined : 'img'}
      aria-label={measuredPct == null
        ? `${label}: telemetry unavailable`
        : `${label}: ${pct.toFixed(1)}% of capacity${effectiveKva == null ? '' : `, ${effectiveKva} kVA rated capacity`}`}
      style={{
        width: '100%',
        height: measuredPct == null ? 'auto' : `${height}px`,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {measuredPct == null
        ? <p style={{ color: 'var(--color-ink-300)', fontSize: '13px' }}>Transformer load telemetry is unavailable.</p>
        : (
          <>
            <div
              aria-hidden="true"
              style={{
                flex: '0 0 28px',
                textAlign: 'center',
                color: 'var(--color-ink-300)',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              {label}{effectiveKva == null ? '' : ` · ${effectiveKva} kVA rated`}
            </div>
            <div ref={ref} style={{ width: '100%', height: `${height - 28}px`, minHeight: 0 }} />
          </>
        )}
    </div>
  )
})
