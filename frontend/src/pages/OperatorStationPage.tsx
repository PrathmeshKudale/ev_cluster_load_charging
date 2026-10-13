import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, RefreshCw } from 'lucide-react'
import { useStation } from '@/lib/queries'
import { PageError, PageLoader } from '@/components/PageStates'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const OperatorStationPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>()
  const { data: station, isLoading, error, refetch, isFetching } = useStation(id)

  if (isLoading) return <PageLoader label={`Loading station ${id} configuration...`} />
  if (error) return <PageError error={error as Error} reset={() => refetch()} />
  if (!station) return <PageError error={new Error(`Station ${id} was not returned by the cluster service.`)} />

  const locationUrl = station.latitude != null && station.longitude != null
    ? `https://www.google.com/maps?q=${station.latitude},${station.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(station.name)}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Link to="/operator" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-ink-300)', textDecoration: 'none', fontSize: '13px' }}>
        <ArrowLeft size={14} /> Back to Operator Overview
      </Link>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>{station.name} ({station.id})</CardTitle>
            <p style={{ color: 'var(--color-ink-300)', fontSize: '13px', marginTop: '4px' }}>
              Station configuration provided by the connected cluster service.
            </p>
          </div>
          <button type="button" disabled={isFetching} onClick={() => refetch()} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} /> {isFetching ? 'Refreshing…' : 'Refresh'}
          </button>
        </CardHeader>
        <CardContent style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px' }}>
          <div><p>Installed chargers</p><strong>{station.chargers}</strong></div>
          <div><p>Power per charger</p><strong>{station.kw} kW</strong></div>
          <div><p>Route detour estimate</p><strong>{station.detour} min</strong></div>
          <div>
            <p>Coordinates</p>
            <strong>{station.latitude != null && station.longitude != null
              ? `${station.latitude.toFixed(5)}, ${station.longitude.toFixed(5)}`
              : 'Not configured'}</strong>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Live charger operations</CardTitle></CardHeader>
        <CardContent>
          <p style={{ color: 'var(--color-ink-300)', fontSize: '13px' }}>
            This API currently returns station configuration only. Live bay status and remote OCPP commands are not available for this station, so no status or command has been assumed.
          </p>
          <a href={locationUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '12px', color: 'var(--color-trafo-blue)' }}>
            Open station location <ExternalLink size={14} />
          </a>
        </CardContent>
      </Card>
    </div>
  )
}

export default OperatorStationPage
