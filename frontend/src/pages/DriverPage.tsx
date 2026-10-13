import React from 'react'
import { useClusters, useStations } from '@/lib/queries'
import { useUIStore } from '@/store/uiStore'
import { ClusterMap } from '@/features/cluster/ClusterMap'
import { StationCard } from '@/features/cluster/StationCard'
import { PageLoader, PageError } from '@/components/PageStates'
import type { ClusterFixture } from '@/fixtures/clusterFixture'
import type { StationDetailFixture } from '@/fixtures/stationsFixture'
import { MapPin, Navigation } from 'lucide-react'
import { Link } from 'react-router-dom'

export const DriverPage: React.FC = () => {
  const selectedStationId = useUIStore((s) => s.selectedStationId)
  const setSelectedStationId = useUIStore((s) => s.setSelectedStationId)
  const showToast = useUIStore((s) => s.showToast)

  const { data: clusterData, isLoading: clusterLoading, error: clusterError, refetch: refetchClusters } = useClusters()
  const { data: stationsData, isLoading: stationsLoading, error: stationsError, refetch: refetchStations } = useStations()

  if (clusterLoading || stationsLoading) {
    return <PageLoader label="Loading cluster map and station data..." />
  }

  if (clusterError || stationsError) {
    return (
      <PageError
        error={(clusterError as Error) || (stationsError as Error)}
        reset={() => {
          refetchClusters()
          refetchStations()
        }}
      />
    )
  }

  if (!clusterData || !stationsData) {
    return <PageError error={new Error('The cluster service returned an incomplete response.')} />
  }

  const stationsList: StationDetailFixture[] = (stationsData?.items ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    cluster_id: 'C1',
    chargers_count: item.chargers,
    kw_per_charger: item.kw,
    detour_min: item.detour,
    latitude: item.latitude,
    longitude: item.longitude,
    location_verified: item.location_verified,
  }))

  const clusterMapData: ClusterFixture = {
    cluster_id: 'C1',
    name: 'Charging station cluster',
    transformer_id: 'T1',
    transformer_name: 'Cluster transformer',
    rating_kva: clusterData.transformer_kva,
    power_factor: clusterData.power_factor,
    stations: clusterData.stations.map((station) => ({
      id: station.id,
      name: station.name,
      chargers: station.chargers,
      kw: station.kw,
      detour_min: station.detour,
      latitude: station.latitude,
      longitude: station.longitude,
      location_verified: station.location_verified,
    })),
    edges: [],
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner with Quick Action */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'linear-gradient(90deg, rgba(30, 136, 229, 0.12) 0%, rgba(10, 31, 36, 0.4) 100%)',
          border: '1px solid var(--color-ink-700)',
          borderRadius: '10px',
          padding: '16px 20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              padding: '10px',
              borderRadius: '8px',
              background: 'var(--color-trafo-blue)',
              color: '#fff',
            }}
          >
            <MapPin size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#fff' }}>
              Substation Cluster Station Map
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--color-ink-300)', margin: '2px 0 0' }}>
              Station locations, charger capacity, and route recommendations from the connected cluster service.
            </p>
          </div>
        </div>
        <Link
          to="/driver/recommend"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '6px',
            background: 'var(--color-trafo-blue)',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <Navigation size={15} />
          <span>Get Smart Recommendation</span>
        </Link>
      </div>

      {/* Cluster Map SVG */}
      <section aria-label="Interactive Cluster Map">
        <ClusterMap
          data={clusterMapData}
          selectedStationId={selectedStationId}
          onSelectStation={(id) => {
            setSelectedStationId(id)
            const st = stationsList.find((s) => s.id === id)
            if (st) showToast(`Selected ${st.name} (${st.id}) on Cluster Map`, 'info')
          }}
        />
      </section>

      {/* Stations Grid */}
      <section aria-label="Available Charging Hubs">
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '14px', color: 'var(--color-ink-100)' }}>
          Active Stations in Feeder Zone ({stationsList.length})
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px',
          }}
        >
          {stationsList.map((station) => (
            <div
              key={station.id}
              style={{
                borderRadius: '8px',
                border: selectedStationId === station.id ? '2px solid var(--color-trafo-blue)' : '2px solid transparent',
                transition: 'border 0.15s ease',
              }}
            >
              <StationCard
                station={station}
                selected={selectedStationId === station.id}
                onSelect={(id) => {
                  setSelectedStationId(id)
                  showToast(`Selected ${station.name} (${station.id})`, 'info')
                }}
              />
            </div>
          ))}
          {stationsList.length === 0 && (
            <p style={{ color: 'var(--color-ink-300)' }}>
              No stations are configured for this cluster.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

export default DriverPage
