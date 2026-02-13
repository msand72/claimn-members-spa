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