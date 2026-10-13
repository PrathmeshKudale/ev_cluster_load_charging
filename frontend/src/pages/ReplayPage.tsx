import React, { useEffect, useRef, useState } from 'react'
import { Activity, AlertTriangle, Play, Pause, RotateCcw } from 'lucide-react'
import { useSimulationMetrics } from '@/lib/queries'
import { getApiWebSocketUrl } from '@/lib/api'
import { PageError, PageLoader } from '@/components/PageStates'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ReplayFrame {
  tick: number
  time_str: string
  progress_pct: number
  speed_multiplier: number
  status: string
  cluster_load_pct: number
  p10_load_pct: number
  p50_load_pct: number
  p90_load_pct: number
  transformer_status: string
  warn_threshold_pct: number
  crit_threshold_pct: number
  stations: Array<{
    id: string
    name: string
    total_bays: number
    occupied_bays: number
    available_bays: number
    occupancy_pct: number
    queue_len: number
    queue_wait_min: number
    kw_rate: number
  }>
  alerts: Array<{
    id: string
    severity: string
    entity_type: string
    entity_id: string
    message: string
    timestamp: string
  }>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isReplayStation(value: unknown): value is ReplayFrame['stations'][number] {
  return isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.total_bays === 'number' &&
    typeof value.occupied_bays === 'number' &&
    typeof value.available_bays === 'number' &&
    typeof value.occupancy_pct === 'number' &&
    typeof value.queue_len === 'number' &&
    typeof value.queue_wait_min === 'number' &&
    typeof value.kw_rate === 'number'
}

function isReplayAlert(value: unknown): value is ReplayFrame['alerts'][number] {
  return isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.severity === 'string' &&
    typeof value.entity_type === 'string' &&
    typeof value.entity_id === 'string' &&
    typeof value.message === 'string' &&
    typeof value.timestamp === 'string'
}

function asReplayFrame(value: unknown): ReplayFrame | null {
  if (
    !isRecord(value) ||
    typeof value.tick !== 'number' ||
    typeof value.time_str !== 'string' ||
    typeof value.progress_pct !== 'number' ||
    typeof value.speed_multiplier !== 'number' ||
    typeof value.status !== 'string' ||
    typeof value.cluster_load_pct !== 'number' ||
    !Array.isArray(value.stations) ||
    !value.stations.every(isReplayStation) ||
    !Array.isArray(value.alerts) ||
    !value.alerts.every(isReplayAlert) ||
    typeof value.p10_load_pct !== 'number' ||
    typeof value.p50_load_pct !== 'number' ||
    typeof value.p90_load_pct !== 'number' ||
    typeof value.transformer_status !== 'string' ||
    typeof value.warn_threshold_pct !== 'number' ||
    typeof value.crit_threshold_pct !== 'number'
  ) {
    return null
  }
  return {
    tick: value.tick,
    time_str: value.time_str,
    progress_pct: value.progress_pct,
    speed_multiplier: value.speed_multiplier,
    status: value.status,
    cluster_load_pct: value.cluster_load_pct,
    p10_load_pct: value.p10_load_pct,
    p50_load_pct: value.p50_load_pct,
    p90_load_pct: value.p90_load_pct,
    transformer_status: value.transformer_status,
    warn_threshold_pct: value.warn_threshold_pct,
    crit_threshold_pct: value.crit_threshold_pct,
    stations: value.stations,
    alerts: value.alerts,
  }
}

function formatMetric(value: number | undefined, suffix = ''): string {
  return value == null ? '—' : `${value.toFixed(1)}${suffix}`
}

export const ReplayPage: React.FC = () => {
  const { data: metrics, isLoading, error, refetch } = useSimulationMetrics()
  const socketRef = useRef<WebSocket | null>(null)
  const [frame, setFrame] = useState<ReplayFrame | null>(null)
  const [socketStatus, setSocketStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting')
  const [socketError, setSocketError] = useState<string | null>(null)
  const [speed, setSpeed] = useState(60)

  useEffect(() => {
    const socket = new WebSocket(getApiWebSocketUrl('ws/replay'))
    socketRef.current = socket

    socket.onopen = () => {
      setSocketStatus('connected')
      setSocketError(null)
    }
    socket.onmessage = (event) => {
      let payload: unknown
      try {
        payload = JSON.parse(event.data)
      } catch {
        setSocketError('The replay service sent an invalid message.')
        return
      }

      if (!isRecord(payload)) return
      if (payload.type === 'replay_connected') {
        const initialFrame = asReplayFrame(payload.frame)
        if (initialFrame) setFrame(initialFrame)
        return
      }
      const nextFrame = asReplayFrame(payload)
      if (nextFrame) {
        setFrame(nextFrame)
        setSpeed(nextFrame.speed_multiplier)
      } else if (payload.type === 'state_changed' && isRecord(payload.state)) {
        const state = payload.state
        setFrame((current) => current ? {
          ...current,
          tick: typeof state.current_tick === 'number' ? state.current_tick : current.tick,
          progress_pct: typeof state.progress_pct === 'number' ? state.progress_pct : current.progress_pct,
          speed_multiplier: typeof state.speed_multiplier === 'number' ? state.speed_multiplier : current.speed_multiplier,
          status: typeof state.status === 'string' ? state.status : current.status,
        } : current)
      } else if (payload.type === 'replay_complete') {
        setFrame((current) => current ? { ...current, status: 'completed' } : current)
      }
    }
    socket.onerror = () => {
      setSocketStatus('error')
      setSocketError('Could not connect to the replay WebSocket. Check the API URL and backend WebSocket support.')
    }
    socket.onclose = () => {
      setSocketStatus((status) => status === 'error' ? status : 'disconnected')
    }

    return () => {
      socket.close()
      socketRef.current = null
    }
  }, [])

  const sendCommand = (action: string, details: Record<string, number> = {}) => {
    const socket = socketRef.current
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setSocketError('Replay controls are unavailable while the backend is disconnected.')
      return
    }
    socket.send(JSON.stringify({ action, ...details }))
    setSocketError(null)
  }

  if (isLoading) return <PageLoader label="Loading benchmark results from the simulation service..." />
  if (error) return <PageError error={error as Error} reset={() => refetch()} />

  const fcfs = metrics?.fcfs
  const smart = metrics?.smart ?? metrics?.smart_dispatch
  const isConnected = socketStatus === 'connected'
  const isPlaying = frame?.status === 'running'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Badge variant={isConnected ? 'normal' : 'warn'} icon={<Activity size={12} />}>
            Replay backend: {socketStatus}
          </Badge>
          {frame && <Badge variant="neutral">{frame.status}</Badge>}
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#fff' }}>Grid Simulation Replay</h1>
        <p style={{ fontSize: '13px', color: 'var(--color-ink-300)', marginTop: '4px' }}>
          Playback, transformer estimates, station states, and alerts are streamed by the backend replay service.
        </p>
      </div>

      {socketError && (
        <div role="alert" style={{ color: 'var(--color-crit-red)', fontSize: '13px' }}>{socketError}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Replay controls</CardTitle>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" disabled={!isConnected} onClick={() => sendCommand(
              isPlaying ? 'pause' : frame?.status === 'paused' ? 'resume' : 'start',
              { speed, horizon_hours: 24 },
            )}>
              {isPlaying ? <Pause size={16} /> : <Play size={16} />} {isPlaying ? 'Pause' : 'Start'}
            </button>
            <button type="button" disabled={!isConnected} onClick={() => sendCommand('reset')}>
              <RotateCcw size={16} /> Reset
            </button>
          </div>
        </CardHeader>
        <CardContent style={{ display: 'grid', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>Speed</span>
            <select value={speed} disabled={!isConnected} onChange={(event) => {
              const nextSpeed = Number(event.target.value)
              setSpeed(nextSpeed)
              sendCommand('speed', { speed: nextSpeed })
            }}>
              {[1, 10, 60, 1440].map((value) => <option key={value} value={value}>{value}×</option>)}
            </select>
          </label>
          <label style={{ display: 'grid', gap: '6px' }}>
            <span>{frame ? `${frame.time_str} · ${frame.progress_pct.toFixed(1)}%` : 'Waiting for the replay service...'}</span>
            <input
              type="range"
              min={0}
              max={frame ? Math.max(frame.tick, 1440) : 1440}
              value={frame?.tick ?? 0}
              disabled={!isConnected || !frame}
              onChange={(event) => sendCommand('seek', { tick: Number(event.target.value) })}
            />
          </label>
        </CardContent>
      </Card>

      {frame ? (
        <>
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <Card><CardContent><p>Median load</p><strong>{formatMetric(frame.p50_load_pct, '%')}</strong></CardContent></Card>
            <Card><CardContent><p>P90 load</p><strong>{formatMetric(frame.p90_load_pct, '%')}</strong></CardContent></Card>
            <Card><CardContent><p>Transformer status</p><strong>{frame.transformer_status}</strong></CardContent></Card>
            <Card><CardContent><p>Replay time</p><strong>{frame.time_str}</strong></CardContent></Card>
          </section>

          <Card>
            <CardHeader><CardTitle>Station state at this replay tick</CardTitle></CardHeader>
            <CardContent>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead><tr><th>Station</th><th>In use</th><th>Available</th><th>Occupancy</th><th>Queue</th><th>Wait</th></tr></thead>
                  <tbody>{frame.stations.map((station) => (
                    <tr key={station.id}>
                      <td>{station.name}</td>
                      <td>{station.occupied_bays}/{station.total_bays}</td>
                      <td>{station.available_bays}</td>
                      <td>{formatMetric(station.occupancy_pct, '%')}</td>
                      <td>{station.queue_len}</td>
                      <td>{formatMetric(station.queue_wait_min, ' min')}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle><AlertTriangle size={17} /> Replay alerts ({frame.alerts.length})</CardTitle></CardHeader>
            <CardContent>
              {frame.alerts.length === 0 ? <p>No active alerts at this replay tick.</p> : (
                <ul style={{ display: 'grid', gap: '8px', paddingLeft: '20px' }}>
                  {frame.alerts.map((alert) => (
                    <li key={alert.id}>{alert.timestamp} · {alert.message}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <p style={{ color: 'var(--color-ink-300)' }}>The replay service has not sent its initial frame yet.</p>
      )}

      <Card>
        <CardHeader><CardTitle>Simulation benchmark results</CardTitle></CardHeader>
        <CardContent style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div><p>FCFS peak load</p><strong>{formatMetric(fcfs?.peak_load_kw, ' kW')}</strong></div>
          <div><p>Smart-dispatch peak load</p><strong>{formatMetric(smart?.peak_load_kw, ' kW')}</strong></div>
          <div><p>FCFS mean wait</p><strong>{formatMetric(fcfs?.mean_wait_min, ' min')}</strong></div>
          <div><p>Smart-dispatch mean wait</p><strong>{formatMetric(smart?.mean_wait_min, ' min')}</strong></div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ReplayPage
