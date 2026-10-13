import React from 'react'
import { RefreshCw } from 'lucide-react'
import { useTransformerRisk } from '@/lib/queries'
import { TransformerGauge } from '@/features/transformer/TransformerGauge'
import { AlertFeed } from '@/features/transformer/AlertFeed'
import { PageError, PageLoader } from '@/components/PageStates'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const OperatorTransformerPage: React.FC = () => {
  const { data, isLoading, error, refetch, isFetching } = useTransformerRisk('T1')

  if (isLoading) return <PageLoader label="Loading transformer risk forecast..." />
  if (error) return <PageError error={error as Error} reset={() => refetch()} />
  if (!data) return <PageError error={new Error('The transformer service returned no risk data.')} />

  const alert = data.level === 'ok' ? [] : [{
    id: `${data.transformer_id}-${data.level}-${data.peak_hour}`,
    timestamp: `Forecast peak at ${String(data.peak_hour).padStart(2, '0')}:00`,
    severity: data.level === 'critical' ? 'crit' as const : 'warn' as const,
    entity_type: 'transformer' as const,
    entity_id: data.transformer_id,
    message: `P90 forecast peaks at ${data.peak_p90_pct.toFixed(1)}% of ${data.kva} kVA rated capacity.`,
  }]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>Transformer Risk Monitor</h1>
          <p style={{ fontSize: '13px', color: 'var(--color-ink-300)', marginTop: '4px' }}>
            Forecast and thresholds returned by transformer {data.transformer_id}.
          </p>
        </div>
        <button type="button" onClick={() => refetch()} disabled={isFetching} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={14} /> {isFetching ? 'Refreshing…' : 'Refresh forecast'}
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        <Card>
          <CardHeader><CardTitle>24-hour P90 forecast peak</CardTitle></CardHeader>
          <CardContent>
            <TransformerGauge
              peakPct={data.peak_p90_pct}
              kva={data.kva}
              warnThreshold={data.warn_threshold_pct}
              critThreshold={data.crit_threshold_pct}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Forecast details</CardTitle></CardHeader>
          <CardContent style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <span>Risk status</span>
              <Badge variant={data.level === 'critical' ? 'crit' : data.level === 'warning' ? 'warn' : 'normal'}>
                {data.level}
              </Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <span>Nameplate capacity</span><strong>{data.kva} kVA</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <span>Peak forecast hour</span><strong>{String(data.peak_hour).padStart(2, '0')}:00</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <span>First warning hour</span>
              <strong>{data.first_warning_hour == null ? 'None forecast' : `${String(data.first_warning_hour).padStart(2, '0')}:00`}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <span>Warning threshold</span><strong>{data.warn_threshold_pct}%</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <span>Critical threshold</span><strong>{data.crit_threshold_pct}%</strong>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertFeed alerts={alert} />
    </div>
  )
}

export default OperatorTransformerPage
