import { createPortal } from 'react-dom'
import type { CVCAssessmentStatus } from '../../lib/api/types'
import {
  BIOMARKER_CONFIGS,
  BIOMARKER_ORDER,
  CVC_TYPE_LABELS,
  CVC_SHORT_LABELS,
} from '../../lib/cvc/constants'
import { interpretBiomarker, interpretVitalityIndex, normalizeScore } from '../../lib/cvc/interpretation'

interface CVCPrintReportProps {
  programName: string
  completedCVCs: CVCAssessmentStatus[]
  contextAnswers?: Record<string, Record<string, string>>
}

export function CVCPrintReport({ programName, completedCVCs, contextAnswers }: CVCPrintReportProps) {
  const latest = completedCVCs[completedCVCs.length - 1]
  const latestScores = latest?.scores
  const vitalityIndex = latestScores?.percentage_score ?? 0
  const vitalityInterp = interpretVitalityIndex(vitalityIndex)

  return createPortal(
    <div className="print-report">
      {/* ===== PAGE 1: Cover ===== */}
      <div className="print-page">
        <div className="print-cover">
          <p className="print-brand">CLAIM'N</p>
          <h1 className="print-title">Vitality Check Report</h1>
          <div className="print-divider" />
          <p className="print-subtitle">{programName}</p>
          <p className="print-vitality-hero">{Math.round(vitalityIndex)}%</p>
          <p className="print-vitality-label">Vitality Index — {vitalityInterp.level}</p>
          {latest?.completed_at && (
            <p className="print-secondary">
              {CVC_TYPE_LABELS[latest.type] || latest.name} — Completed {new Date(latest.completed_at).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="print-section" style={{ marginTop: '2rem' }}>
          <h3 className="print-h3">What is the Vitality Index?</h3>
          <p>
            The CLAIM'N Vitality Index is a composite score (0-100%) derived from three validated
            biomarker instruments: the Subjective Vitality Scale (SVS), the Perceived Stress Scale
            (PSS-10), and an adapted Pittsburgh Sleep Quality Index (PSQI). Higher scores indicate
            better overall vitality.
          </p>
        </div>
      </div>

      {/* ===== PAGE 2: Biomarker Scores ===== */}
      <div className="print-page">
        <h2 className="print-h2">Biomarker Scores</h2>

        <table className="print-table">
          <thead>
            <tr>
              <th>Biomarker</th>
              <th>Score</th>
              <th>Scale</th>
              <th>Level</th>
              <th>Bar</th>
            </tr>
          </thead>
          <tbody>
            {BIOMARKER_ORDER.map((key) => {
              const config = BIOMARKER_CONFIGS[key]
              const raw = latestScores?.category_scores?.[key] ?? 0
              const interp = interpretBiomarker(key, raw)
              const barPct = normalizeScore(key, raw)
              return (
                <tr key={key}>
                  <td className="print-td-label">{config.label} ({config.instrument})</td>
                  <td className="print-td-center">
                    {raw.toFixed(1)} / {config.maxScore}
                  </td>
                  <td className="print-td-center">
                    {config.lowerIsBetter ? 'Lower = Better' : 'Higher = Better'}
                  </td>
                  <td className="print-td-center">{interp.level}</td>
                  <td className="print-td-bar">
                    <div className="print-bar-bg">
                      <div className="print-bar-fill" style={{ width: `${barPct}%` }} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Trend comparison table if multiple CVCs */}
        {completedCVCs.length > 1 && (
          <>
            <h2 className="print-h2" style={{ marginTop: '2rem' }}>Trend Comparison</h2>
            <table className="print-table">
              <thead>
                <tr>
                  <th>Biomarker</th>
                  {completedCVCs.map((cvc) => (
                    <th key={cvc.assessment_id}>{CVC_SHORT_LABELS[cvc.type] || cvc.type}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BIOMARKER_ORDER.map((key) => {
                  const config = BIOMARKER_CONFIGS[key]
                  return (
                    <tr key={key}>
                      <td className="print-td-label">{config.label}</td>
                      {completedCVCs.map((cvc) => {
                        const val = cvc.scores?.category_scores?.[key]
                        return (
                          <td key={cvc.assessment_id} className="print-td-center">
                            {val != null ? val.toFixed(1) : '—'}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
                <tr>
                  <td className="print-td-label">Vitality Index</td>
                  {completedCVCs.map((cvc) => (
                    <td key={cvc.assessment_id} className="print-td-center">
                      {cvc.scores ? `${Math.round(cvc.scores.percentage_score)}%` : '—'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* ===== PAGE 3: Context (if present) ===== */}
      {contextAnswers && Object.keys(contextAnswers).length > 0 && (
        <div className="print-page">
          <h2 className="print-h2">Context & Reflections</h2>
          {completedCVCs.map((cvc) => {
            const answers = contextAnswers[cvc.assessment_id]
            if (!answers || Object.keys(answers).length === 0) return null
            return (
              <div key={cvc.assessment_id} className="print-section">
                <h3 className="print-h3">{CVC_TYPE_LABELS[cvc.type] || cvc.name}</h3>
                {Object.entries(answers).map(([question, answer]) => (
                  <div key={question} className="print-insight">
                    <h4 className="print-h4">{question}</h4>
                    <p>{answer}</p>
                  </div>
                ))}
              </div>
            )
          })}

          <div className="print-footer-note">
            <p>Generated by CLAIM'N Vitality Check — claimn.co</p>
          </div>
        </div>
      )}

      {/* Footer on last page if no context page */}
      {(!contextAnswers || Object.keys(contextAnswers).length === 0) && (
        <div className="print-footer-note">
          <p>Generated by CLAIM'N Vitality Check — claimn.co</p>
        </div>
      )}
    </div>,
    document.body
  )
}
