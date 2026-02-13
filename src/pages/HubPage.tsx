// ── HubPage (main) ───────────────────────────────────

export function HubPage() {
  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Welcome Banner — full width */}
        <PageErrorBoundary section="WelcomeBanner">
          <WelcomeBanner />
        </PageErrorBoundary>

        {/* Stats row — full width */}
        <PageErrorBoundary section="StatsRow">
          <StatsRow />
        </PageErrorBoundary>

        {/* 2-column grid: main (2/3) + sidebar (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">