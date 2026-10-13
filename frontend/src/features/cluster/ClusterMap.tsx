import React, { useCallback, useMemo, useState } from 'react'
import { Zap, Activity, MapPin, Globe, ExternalLink } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ClusterFixture } from '@/fixtures/clusterFixture'
import { StationMap, type StationMapMarker } from './StationMap'

export interface ClusterMapProps {
  data: ClusterFixture
  selectedStationId?: string
  onSelectStation?: (stationId: string) => void
}

export const ClusterMap: React.FC<ClusterMapProps> = ({
  data,
  selectedStationId: externalSelectedId,
  onSelectStation,
}) => {
  const [localSelectedId, setLocalSelectedId] = useState<string>('S1')
  const [viewMode, setViewMode] = useState<'map' | 'topology'>('map')
  const selectedStationId = externalSelectedId ?? localSelectedId

  const handleStationClick = useCallback((id: string) => {
    setLocalSelectedId(id)
    onSelectStation?.(id)
  }, [onSelectStation])

  const selectedStation = data.stations.find((s) => s.id === selectedStationId) || data.stations[0]

  const mapMarkers: StationMapMarker[] = useMemo(() => data.stations
    .filter((s): s is typeof s & { latitude: number; longitude: number } =>
      s.latitude != null && s.longitude != null)
    .map((s) => ({
    id: s.id,
    name: s.name,
    latitude: s.latitude,
    longitude: s.longitude,
    utilization: s.utilization_rate,
    chargers: s.chargers,
    ...(s.status && { queueDepth: s.status === 'busy' ? 2 : s.status === 'full' ? 5 : 0 }),
  })), [data.stations])

  // Relative SVG positions for 4 stations and transformer in a 640x360 coordinate system
  const nodePositions: Record<string, { x: number; y: number }> = {
    T1: { x: 320, y: 50 },  // Central substation transformer
    S1: { x: 320, y: 170 }, // Market Road (Central trunk)
    S2: { x: 130, y: 220 }, // Station Plaza (West)
    S3: { x: 250, y: 300 }, // College Gate (South)
    S4: { x: 510, y: 240 }, // Ring Road Hub (East)
  }

  const statusColors = {
    available: 'var(--color-safe-green)',
    busy: 'var(--color-warn-amber)',
    full: 'var(--color-crit-red)',
  }

  return (
    <Card className="cluster-map-container" style={{ width: '100%', overflow: 'hidden' }}>
      <CardHeader>
        <div>
          <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={20} color="var(--color-trafo-blue)" />
            <span>Cluster Map & Station Locations</span>
          </CardTitle>
          <p style={{ fontSize: '13px', color: 'var(--color-ink-300)', marginTop: '2px' }}>
            {data.name} • Transformer rating: {data.rating_kva} kVA • {data.stations.length} stations
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', background: 'var(--color-ink-900)', padding: '3px', borderRadius: '6px', border: '1px solid var(--color-ink-700)' }}>
            <button
              onClick={() => setViewMode('map')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: '4px',
                background: viewMode === 'map' ? 'var(--color-trafo-blue)' : 'transparent',
                color: viewMode === 'map' ? '#fff' : 'var(--color-ink-300)',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Globe size={13} />
              <span>Real GPS Map</span>
            </button>
            <button
              onClick={() => data.edges.length > 0 && setViewMode('topology')}
              disabled={data.edges.length === 0}
              title={data.edges.length === 0 ? 'Topology links are not supplied by the cluster service.' : undefined}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: '4px',
                background: viewMode === 'topology' ? 'var(--color-trafo-blue)' : 'transparent',
                color: viewMode === 'topology' ? '#fff' : 'var(--color-ink-300)',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                cursor: data.edges.length === 0 ? 'not-allowed' : 'pointer',
                opacity: data.edges.length === 0 ? 0.55 : 1,
              }}
            >
              <Activity size={13} />
              <span>Grid Schematic</span>
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent style={{ padding: 0 }}>
        {viewMode === 'map' ? (
          <div>
            {mapMarkers.length > 0 ? (
              <StationMap
                markers={mapMarkers}
                selectedStationId={selectedStationId}
                onMarkerClick={handleStationClick}
                height={400}
              />
            ) : (
              <p style={{ padding: '32px', color: 'var(--color-ink-300)' }}>
                Station coordinates are not available from the cluster service.
              </p>
            )}
            {/* Real GPS Coordinates telemetry bar */}
            {selectedStation && <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'var(--color-ink-900)',
                borderTop: '1px solid var(--color-ink-700)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={16} color="var(--color-trafo-blue)" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                  {selectedStation?.name} ({selectedStation?.id})
                </span>
                <span style={{ fontSize: '12px', color: 'var(--color-ink-300)' }}>
                  {selectedStation?.latitude != null && selectedStation.longitude != null
                    ? <>• GPS: <b style={{ color: '#fff' }}>{selectedStation.latitude.toFixed(4)}°, {selectedStation.longitude.toFixed(4)}°</b></>
                    : '• GPS coordinates unavailable'}
                </span>
              </div>
              <a
                href={selectedStation?.latitude != null && selectedStation.longitude != null
                  ? `https://www.google.com/maps?q=${selectedStation.latitude},${selectedStation.longitude}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedStation?.name ?? '')}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: 'var(--color-trafo-blue)',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                <span>View on Google Maps</span>
                <ExternalLink size={12} />
              </a>
            </div>}
          </div>
        ) : (
          <div
            style={{
              position: 'relative',
              width: '100%',
              backgroundColor: 'var(--color-ink-950)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-ink-700)',
              overflow: 'hidden',
            }}
          >
          <svg
            viewBox="0 0 640 370"
            style={{ width: '100%', height: 'auto', display: 'block' }}
            role="img"
            aria-label="Cluster substation feeder and station network map"
          >
            {/* Grid pattern background */}
            <defs>
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(24, 62, 71, 0.4)" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="640" height="370" fill="url(#grid)" />

            {/* ST-GNN directed edges between stations */}
            {data.edges.map((edge, idx) => {
              const p1 = nodePositions[edge.src]
              const p2 = nodePositions[edge.dst]
              if (!p1 || !p2) return null
              const isConnected = edge.src === selectedStationId || edge.dst === selectedStationId
              return (
                <g key={`edge-${idx}`}>
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke={isConnected ? 'var(--color-trafo-blue)' : 'var(--color-ink-700)'}
                    strokeWidth={isConnected ? 2 : 1}
                    opacity={isConnected ? 0.9 : 0.4}
                  />
                </g>
              )
            })}

            {/* Substation Transformer Node */}
            <g transform={`translate(${nodePositions.T1.x}, ${nodePositions.T1.y})`}>
              <rect
                x="-55"
                y="-22"
                width="110"
                height="44"
                rx="6"
                fill="var(--color-ink-800)"
                stroke="var(--color-trafo-blue)"
                strokeWidth="2"
              />
              <text
                x="0"
                y="-4"
                textAnchor="middle"
                fill="var(--color-trafo-blue)"
                fontSize="11"
                fontWeight="700"
                fontFamily="var(--font-sans)"
              >
                SUBSTATION T1
              </text>
              <text
                x="0"
                y="12"
                textAnchor="middle"
                fill="var(--color-ink-100)"
                fontSize="10"
                fontFamily="var(--font-mono)"
              >
                {data.rating_kva} kVA
              </text>
            </g>

            {/* Station Nodes */}
            {data.stations.map((st) => {
              const pos = nodePositions[st.id]
              if (!pos) return null
              const isSelected = st.id === selectedStationId
              const stColor = st.status ? statusColors[st.status] : 'var(--color-ink-400)'

              return (
                <g
                  key={st.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleStationClick(st.id)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${st.name} station, ${st.chargers} bays`}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleStationClick(st.id)}
                >
                  {/* Outer pulse circle if selected */}
                  {isSelected && (
                    <circle r="34" fill="var(--color-trafo-blue-tint)" stroke="var(--color-trafo-blue)" strokeWidth="1.5" />
                  )}
                  {/* Node Box */}
                  <rect
                    x="-48"
                    y="-22"
                    width="96"
                    height="44"
                    rx="8"
                    fill="var(--color-ink-800)"
                    stroke={isSelected ? 'var(--color-trafo-blue)' : stColor}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  />
                  <text
                    x="0"
                    y="-5"
                    textAnchor="middle"
                    fill="var(--color-ink-100)"
                    fontSize="11"
                    fontWeight="700"
                    fontFamily="var(--font-sans)"
                  >
                    {st.name.split(' ')[0]} ({st.id})
                  </text>
                  <text
                    x="0"
                    y="11"
                    textAnchor="middle"
                    fill={stColor}
                    fontSize="10"
                    fontWeight="600"
                    fontFamily="var(--font-mono)"
                  >
                    {st.active_chargers != null
                      ? `${st.active_chargers}/${st.chargers} Plugs`
                      : `${st.chargers} Plugs`}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      )}

        {/* Selected Station Drawer Summary */}
        <div
          style={{
            marginTop: '14px',
            padding: '14px 16px',
            backgroundColor: 'var(--color-ink-800)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-ink-700)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--color-ink-100)' }}>
                {selectedStation.name} ({selectedStation.id})
              </span>
              <Badge
                variant={selectedStation.status === 'full' ? 'crit' : selectedStation.status === 'busy' ? 'warn' : selectedStation.status ? 'normal' : 'neutral'}
              >
                {selectedStation.status?.toUpperCase() ?? 'LIVE STATE UNAVAILABLE'}
              </Badge>
            </div>
            <div
              style={{
                display: 'flex',
                gap: '16px',
                fontSize: '13px',
                color: 'var(--color-ink-300)',
                marginTop: '4px',
              }}
            >
              <span>Capacity: {selectedStation.chargers} × {selectedStation.kw} kW</span>
              {selectedStation.current_kw != null && <span>Active Load: {selectedStation.current_kw} kW</span>}
              <span>Detour: {selectedStation.detour_min} min</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleStationClick(selectedStation.id)}
              style={{
                backgroundColor: 'var(--color-trafo-blue)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Inspect Station
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
