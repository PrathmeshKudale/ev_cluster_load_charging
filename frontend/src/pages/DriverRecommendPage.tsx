import { useRecommendations } from '@/lib/queries'
import { useUIStore, type DriverMode } from '@/store/uiStore'
import { RecommendationCard } from '@/features/recommend/RecommendationCard'
import { PageLoader, PageError } from '@/components/PageStates'
import type { CandidateRecommendation } from '@/fixtures/recommendationFixture'
import { Zap, Clock, ShieldCheck, Scale } from 'lucide-react'

export const DriverRecommendPage: React.FC = () => {
  const driverMode = useUIStore((s) => s.driverMode)
  const setDriverMode = useUIStore((s) => s.setDriverMode)
  const showToast = useUIStore((s) => s.showToast)
  const { data: recData, isLoading, error, refetch } = useRecommendations({ mode: driverMode })

  const candidateList: CandidateRecommendation[] = (recData?.top3 && recData.top3.length > 0)
    ? recData.top3
        .map((item, index) => {
          const stationName = item.station || item.station_id
          return {
            rank: index + 1,
            station_id: item.station_id,
            station_name: stationName,
            latitude: item.latitude ?? undefined,
            longitude: item.longitude ?? undefined,
            location_verified: item.location_verified,
            hour: item.hour,
            starts_in_h: item.starts_in_h,
            wait_min: item.wait_min,
            detour_min: item.detour_min,
            grid_load_pct: item.grid_load_pct,
            score: item.score,
            shap_reasons: item.shap_reasons,
            why_reason: `${stationName} was ranked by the ${recData.mode} recommendation service. The service returned a ${item.wait_min.toFixed(1)} minute wait estimate, ${item.detour_min.toFixed(1)} minute detour, and ${item.grid_load_pct.toFixed(1)}% projected grid load.`,
          }
        })
    : []

  const modes: Array<{
    id: DriverMode
    label: string
    sublabel: string
    icon: typeof Zap
    desc: string
  }> = [
    {
      id: 'fastest',
      label: 'Fastest Route',
      sublabel: 'w1=0.47, w2=0.28',
      icon: Clock,
      desc: 'Minimizes wait and detour time. Ideal when in a hurry.',
    },
    {
      id: 'balanced',
      label: 'Balanced (Recommended)',
      sublabel: 'w1=0.33, w2=0.22',
      icon: Scale,
      desc: 'Balanced wait, detour, and cluster grid utilization.',
    },
    {
      id: 'grid_friendly',
      label: 'Grid Friendly',
      sublabel: 'w3=0.26, w4=0.46',
      icon: ShieldCheck,
      desc: 'Protects distribution transformer peak load. Off-peak discount eligible.',
    },
  ]

  if (isLoading) {
    return <PageLoader label="Calculating AHP weights and CP-SAT assignments..." />
  }

  if (error) {
    return <PageError error={error as Error} reset={() => refetch()} />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header and Step Instructions */}
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#fff' }}>
          Smart Charging Station Recommendation
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-ink-300)', marginTop: '4px' }}>
          Choose how the recommendation service should prioritize wait time, detour, and grid load.
        </p>
      </div>

      {/* Preference profile */}
      <section aria-label="Step 1: Select Driver Profile">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'var(--color-trafo-blue)',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            1
          </span>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink-100)' }}>
            Choose Preference Profile
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '12px',
          }}
        >
          {modes.map(({ id, label, sublabel, icon: Icon, desc }) => {
            const isSelected = driverMode === id
            return (
              <button
                key={id}
                onClick={() => {
                  setDriverMode(id)
                  showToast(`Requesting ${label.toLowerCase()} recommendations.`, 'info')
                }}
                aria-pressed={isSelected}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '14px 16px',
                  background: isSelected ? 'rgba(30, 136, 229, 0.18)' : 'var(--color-ink-900)',
                  border: isSelected ? '2px solid var(--color-trafo-blue)' : '1px solid var(--color-ink-700)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  color: 'inherit',
                  transform: isSelected ? 'translateY(-1px)' : 'none',
                  boxShadow: isSelected ? '0 4px 12px rgba(30, 136, 229, 0.25)' : 'none',
                }}
              >
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    background: isSelected ? 'var(--color-trafo-blue)' : 'var(--color-ink-800)',
                    color: '#fff',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: isSelected ? '#fff' : 'var(--color-ink-200)' }}>
                    {label}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-ink-400)', marginTop: '2px' }}>
                    {sublabel}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-ink-300)', marginTop: '6px' }}>
                    {desc}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* Recommendations returned by the API */}
      <section aria-label="Step 2: Recommended Stations">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'var(--color-trafo-blue)',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            2
          </span>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink-100)' }}>
            Ranked options returned by the recommendation service
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {candidateList.map((rec) => (
            <RecommendationCard
              key={rec.station_id}
              recommendation={rec}
              mode={driverMode}
              highlight={rec.rank === 1}
            />
          ))}
          {candidateList.length === 0 && (
            <p style={{ color: 'var(--color-ink-300)' }}>
              The recommendation service returned no charging options for this profile.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

export default DriverRecommendPage
