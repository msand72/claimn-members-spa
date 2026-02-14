import { PILLARS } from '../lib/constants'
import type { PillarId } from '../lib/constants'
import type { PillarScore, AssessmentInsight } from '../lib/api/types'

interface PrintReportProps {
  results: {
    primaryArchetype: string
    secondaryArchetype: string | null
    primaryPercentage: number
    secondaryPercentage: number
    archetypeScores: Record<string, number>
    pillarScores: Record<PillarId, PillarScore>
    consistencyScore: number
    microInsights: AssessmentInsight[]
    integrationInsights: AssessmentInsight[]
    overallScore: number
  }
  contentMap?: Record<string, string>
}

const ARCHETYPE_DISPLAY: Record<string, string> = {
  achiever: 'The Achiever',
  optimizer: 'The Optimizer',
  networker: 'The Networker',
  grinder: 'The Grinder',
  philosopher: 'The Philosopher',
  integrator: 'The Integrator',
}

export function PrintReport({ results, contentMap }: PrintReportProps) {
  const primary = results.primaryArchetype
  const name = contentMap?.[`${primary}_name`] || ARCHETYPE_DISPLAY[primary] || primary.charAt(0).toUpperCase() + primary.slice(1)
  const subtitle = contentMap?.[`${primary}_subtitle`] || ''
  const description = contentMap?.[`${primary}_description`] || ''
  const strengths = contentMap?.[`${primary}_strengths`] || ''
  const weaknesses = contentMap?.[`${primary}_weaknesses`] || ''

  const archetypeEntries = Object.entries(results.archetypeScores).sort((a, b) => b[1] - a[1])

  const sortedPillars = Object.entries(results.pillarScores).sort((a, b) => b[1].raw - a[1].raw)

  return (
    <div className="print-report">
      {/* ===== PAGE 1: Cover ===== */}
      <div className="print-page">
        <div className="print-cover">
          <p className="print-brand">CLAIM'N</p>
          <h1 className="print-title">Archetype Assessment Report</h1>
          <div className="print-divider" />
          <h2 className="print-archetype-name">{name}</h2>
          {subtitle && <p className="print-subtitle">{subtitle}</p>}
          <p className="print-match">{results.primaryPercentage || results.overallScore}% Match</p>
          {results.secondaryArchetype && (
            <p className="print-secondary">
              Secondary: {contentMap?.[`${results.secondaryArchetype}_name`] || ARCHETYPE_DISPLAY[results.secondaryArchetype] || results.secondaryArchetype.charAt(0).toUpperCase() + results.secondaryArchetype.slice(1)} ({results.secondaryPercentage}%)
            </p>
          )}
          {description && <p className="print-description">{description}</p>}
        </div>

        {strengths && (
          <div className="print-section">
            <h3 className="print-h3">Core Strengths</h3>
            <ul className="print-list">
              {strengths.split('\u2022').filter(s => s.trim()).map((s, i) => (
                <li key={i}>{s.trim()}</li>
              ))}
            </ul>
          </div>
        )}

        {weaknesses && (
          <div className="print-section">
            <h3 className="print-h3">Potential Blind Spots</h3>
            <ul className="print-list">
              {weaknesses.split('\u2022').filter(s => s.trim()).map((s, i) => (
                <li key={i}>{s.trim()}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ===== PAGE 2: Pillar Scores ===== */}
      <div className="print-page">
        <h2 className="print-h2">Five Pillar Foundation</h2>

        <table className="print-table">
          <thead>
            <tr>
              <th>Pillar</th>
              <th>Score</th>
              <th>Level</th>
              <th>Bar</th>
            </tr>
          </thead>
          <tbody>
            {sortedPillars.map(([pillar, data]) => (
              <tr key={pillar}>
                <td className="print-td-label">{PILLARS[pillar as PillarId]?.name || pillar}</td>
                <td className="print-td-center">{data.raw.toFixed(1)} / 7.0</td>
                <td className="print-td-center">{data.level.charAt(0).toUpperCase() + data.level.slice(1)}</td>
                <td className="print-td-bar">
                  <div className="print-bar-bg">
                    <div className="print-bar-fill" style={{ width: `${data.percentage}%` }} />
                  </div>
                  <span className="print-bar-pct">{data.percentage}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Archetype Scores */}
        {archetypeEntries.length > 0 && (
          <>
            <h2 className="print-h2" style={{ marginTop: '2rem' }}>Archetype Profile</h2>

            <table className="print-table">
              <thead>
                <tr>
                  <th>Archetype</th>
                  <th>Score</th>
                  <th>Bar</th>
                </tr>
              </thead>
              <tbody>
                {archetypeEntries.map(([archetype, score]) => {
                  const pct = Math.round((score / 6) * 100)
                  const displayName = contentMap?.[`${archetype}_name`] || ARCHETYPE_DISPLAY[archetype] || archetype.charAt(0).toUpperCase() + archetype.slice(1)
                  const isPrimary = archetype === primary
                  return (
                    <tr key={archetype} className={isPrimary ? 'print-row-primary' : ''}>
                      <td className="print-td-label">{displayName}{isPrimary ? ' *' : ''}</td>
                      <td className="print-td-center">{score}/6 ({pct}%)</td>
                      <td className="print-td-bar">
                        <div className="print-bar-bg">
                          <div className="print-bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </>
        )}

        {results.consistencyScore > 0 && (
          <p className="print-footnote">
            Response Consistency: {Math.round(results.consistencyScore * 100)}% ({results.consistencyScore >= 0.8 ? 'High' : results.consistencyScore >= 0.5 ? 'Moderate' : 'Low'})
          </p>
        )}
      </div>

      {/* ===== PAGE 3: Insights ===== */}
      {(results.integrationInsights.length > 0 || results.microInsights.length > 0) && (
        <div className="print-page">
          {results.integrationInsights.length > 0 && (
            <div className="print-section">
              <h2 className="print-h2">Integration Insights</h2>
              {results.integrationInsights.map((insight, idx) => (
                <div key={idx} className="print-insight">
                  <h4 className="print-h4">{insight.title}</h4>
                  <p>{insight.insight}</p>
                </div>
              ))}
            </div>
          )}

          {results.microInsights.length > 0 && (
            <div className="print-section">
              <h2 className="print-h2">Action Plan</h2>
              {results.microInsights.map((insight, idx) => (
                <div key={idx} className="print-insight">
                  <h4 className="print-h4">
                    {insight.priority === 'high' ? '! ' : ''}{insight.title}
                    {insight.pillar && (
                      <span className="print-pill">{PILLARS[insight.pillar as PillarId]?.name || insight.pillar}</span>
                    )}
                  </h4>
                  <p>{insight.insight}</p>
                </div>
              ))}
            </div>
          )}

          <div className="print-footer-note">
            <p>Generated by CLAIM'N Assessment — claimn.co</p>
          </div>
        </div>
      )}
    </div>
  )
}
