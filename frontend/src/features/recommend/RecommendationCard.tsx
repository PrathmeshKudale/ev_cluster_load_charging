import React, { useState } from 'react'
import {
  Zap,
  Clock,
  Navigation,
  ShieldCheck,
  HelpCircle,
  Cpu,
  Scale,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Drawer } from '@/components/ui/drawer'
import { Progress } from '@/components/ui/progress'
import type { CandidateRecommendation } from '@/fixtures/recommendationFixture'

export interface RecommendationCardProps {
  recommendation: CandidateRecommendation
  mode?: 'fastest' | 'balanced' | 'grid_friendly'
  highlight?: boolean
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  mode = 'balanced',
  highlight = true,
}) => {
  const [whyDrawerOpen, setWhyDrawerOpen] = useState(false)
  const isTopRank = recommendation.rank === 1
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(recommendation.station_name)}`

  return (
    <>
      <Card
        elevated={isTopRank || highlight}
        style={{
          borderWidth: isTopRank ? '2px' : '1px',
          borderColor: isTopRank ? 'var(--color-trafo-blue)' : 'var(--color-ink-700)',
          position: 'relative',
        }}
      >
        <CardHeader>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Badge
                variant={isTopRank ? 'brand' : 'neutral'}
                icon={isTopRank ? <Zap size={12} /> : undefined}
              >
                #{recommendation.rank} {isTopRank ? 'RECOMMENDED' : 'ALTERNATIVE'}
              </Badge>
              <span style={{ fontSize: '13px', color: 'var(--color-ink-300)' }}>
                {recommendation.starts_in_h === 0
                  ? 'Starts Now'
                  : `Starts in +${recommendation.starts_in_h}h`}
              </span>
            </div>
            <CardTitle style={{ marginTop: '6px' }}>{recommendation.station_name}</CardTitle>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              className="font-mono-numbers"
              style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-trafo-blue)' }}
            >
              J = {recommendation.score.toFixed(3)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-ink-300)' }}>Optimizer Score</div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Key Driver Decision Factors (Wait, Detour, Headroom) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              backgroundColor: 'var(--color-ink-900)',
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '14px',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-ink-300)' }}>Expected Wait</div>
              <div
                className="font-mono-numbers"
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color:
                    recommendation.wait_min === 0
                      ? 'var(--color-safe-green)'
                      : 'var(--color-ink-100)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '2px',
                }}
              >
                <Clock size={14} color="var(--color-ink-300)" />
                {recommendation.wait_min === 0 ? '0 min (None)' : `${recommendation.wait_min} min`}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-ink-300)' }}>Detour Time</div>
              <div
                className="font-mono-numbers"
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: 'var(--color-ink-100)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '2px',
                }}
              >
                <Navigation size={14} color="var(--color-ink-300)" />
                +{recommendation.detour_min} min
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-ink-300)' }}>Grid Headroom</div>
              <div
                className="font-mono-numbers"
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color:
                    recommendation.grid_load_pct >= 80
                      ? 'var(--color-warn-amber)'
                      : 'var(--color-safe-green)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '2px',
                }}
              >
                <ShieldCheck size={14} color="var(--color-ink-300)" />
                {recommendation.grid_load_pct.toFixed(0)}% Load
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '13px',
              color: 'var(--color-ink-300)',
              marginBottom: '16px',
            }}
          >
            <span>
              {recommendation.available_bays != null && recommendation.total_bays != null
                ? `${recommendation.available_bays} of ${recommendation.total_bays} bays available`
                : 'Live bay availability not provided'}
              {recommendation.charger_kw != null && ` • ${recommendation.charger_kw} kW`}
            </span>
            <button
              onClick={() => setWhyDrawerOpen(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-trafo-blue)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '13px',
                padding: '2px 4px',
              }}
              aria-label={`Open why drawer for ${recommendation.station_name}`}
            >
              <HelpCircle size={14} />
              <span>Why this slot?</span>
            </button>
          </div>

          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              minHeight: '44px',
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-trafo-blue)',
              color: '#fff',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            <Navigation size={16} />
            Get Directions
          </a>
        </CardContent>
      </Card>

      {/* Why Drawer / Sheet Component */}
      <Drawer
        isOpen={whyDrawerOpen}
        onClose={() => setWhyDrawerOpen(false)}
        title={`Why ${recommendation.station_name}?`}
        description={`Multi-objective mathematical dispatch breakdown under '${mode.toUpperCase()}' mode.`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Natural language summary */}
          <div
            style={{
              padding: '14px 16px',
              backgroundColor: 'var(--color-ink-850)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-ink-700)',
              fontSize: '14px',
              lineHeight: 1.6,
              color: 'var(--color-ink-100)',
            }}
          >
            <strong>Optimization Rationale:</strong>
            <p style={{ marginTop: '6px', color: 'var(--color-ink-200)' }}>
              {recommendation.why_reason ?? 'This station was ranked by the recommendation service using its returned score and constraints.'}
            </p>
          </div>

          {/* LightGBM TreeExplainer (Real SHAP Output Top-3 Reasons) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 700 }}>
              <Cpu size={18} color="var(--color-trafo-blue)" />
              <span>LightGBM TreeExplainer (Top 3 SHAP Attributions):</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-ink-300)', margin: 0 }}>
              Attributing forecasted cluster &amp; station power demand (kW) to input features via exact TreeSHAP:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
              {(recommendation.shap_reasons ?? []).map((reason, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    backgroundColor: 'var(--color-ink-950)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-ink-700)',
                    fontSize: '13px',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-ink-800)',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--color-trafo-blue)',
                    }}
                  >
                    #{idx + 1}
                  </span>
                  <span style={{ color: 'var(--color-ink-100)', flex: 1 }}>{reason}</span>
                </div>
              ))}
              {(!recommendation.shap_reasons || recommendation.shap_reasons.length === 0) && (
                <p style={{ color: 'var(--color-ink-300)', fontSize: '13px' }}>
                  The recommendation service did not return feature attributions for this result.
                </p>
              )}
            </div>
          </div>

          {recommendation.score_breakdown && (
          <>
          {/* Multi-Objective Mathematical Formulation */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '15px',
                fontWeight: 700,
                marginBottom: '10px',
              }}
            >
              <Scale size={18} color="var(--color-trafo-blue)" />
              <span>Multi-Objective Score Formulation:</span>
            </div>
            <div
              className="font-mono-numbers"
              style={{
                padding: '12px',
                backgroundColor: 'var(--color-ink-950)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-ink-700)',
                fontSize: '13px',
                color: 'var(--color-ink-200)',
              }}
            >
              J = w₁ · Wait + w₂ · Detour + w₃ · (1 − Balance) + w₄ · OverloadRisk
            </div>
          </div>

          {/* Component Score Contributions Bar Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '13px',
                  marginBottom: '4px',
                }}
              >
                <span>
                  Queue Wait Penalty (w₁ ={' '}
                  {recommendation.score_breakdown.weights.wait})
                </span>
                <span className="font-mono-numbers" style={{ fontWeight: 700 }}>
                  +{recommendation.score_breakdown.wait_component.toFixed(3)}
                </span>
              </div>
              <Progress
                value={recommendation.score_breakdown.wait_component * 200}
                max={100}
                height={6}
              />
            </div>

            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '13px',
                  marginBottom: '4px',
                }}
              >
                <span>
                  Detour Distance Penalty (w₂ ={' '}
                  {recommendation.score_breakdown.weights.detour})
                </span>
                <span className="font-mono-numbers" style={{ fontWeight: 700 }}>
                  +{recommendation.score_breakdown.detour_component.toFixed(3)}
                </span>
              </div>
              <Progress
                value={recommendation.score_breakdown.detour_component * 200}
                max={100}
                height={6}
              />
            </div>

            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '13px',
                  marginBottom: '4px',
                }}
              >
                <span>
                  Station Imbalance Penalty (w₃ ={' '}
                  {recommendation.score_breakdown.weights.balance})
                </span>
                <span className="font-mono-numbers" style={{ fontWeight: 700 }}>
                  +{recommendation.score_breakdown.imbalance_component.toFixed(3)}
                </span>
              </div>
              <Progress
                value={recommendation.score_breakdown.imbalance_component * 200}
                max={100}
                height={6}
              />
            </div>

            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '13px',
                  marginBottom: '4px',
                }}
              >
                <span>
                  Transformer Overload Risk (w₄ ={' '}
                  {recommendation.score_breakdown.weights.risk})
                </span>
                <span className="font-mono-numbers" style={{ fontWeight: 700 }}>
                  +{recommendation.score_breakdown.risk_component.toFixed(3)}
                </span>
              </div>
              <Progress
                value={recommendation.score_breakdown.risk_component * 200}
                max={100}
                height={6}
              />
            </div>
          </div>

          {/* Hard Transformer Safety Guarantee */}
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--color-safe-green-bg)',
              border: '1px solid var(--color-safe-green-border)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '13px',
            }}
          >
            <ShieldCheck size={20} color="var(--color-safe-green)" />
            <span>
              <strong>Hard Safety Guarantee:</strong> Verified via Hypothesis property testing—no slot
              recommendation pushes transformer load above 90% when feasible slots exist.
            </span>
          </div>
          </>
          )}

          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              minHeight: '44px',
              marginTop: '8px',
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-trafo-blue)',
              color: '#fff',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            <Navigation size={16} />
            Get Directions
          </a>
        </div>
      </Drawer>
    </>
  )
}
