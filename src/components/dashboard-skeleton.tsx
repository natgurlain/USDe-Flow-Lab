export function DashboardSkeleton() {
  return (
    <div
      className="dashboard-placeholder"
      role="status"
      aria-label="Loading dashboard panels"
      aria-busy="true"
    >
      <span className="sr-only">Loading dashboard panels</span>
      <div className="placeholder-title" aria-hidden="true" />
      <div className="headline-grid" aria-hidden="true">
        {[0, 1, 2, 3].map((item) => (
          <div className="metric-card placeholder-card" key={item}>
            <span className="placeholder-line" />
            <span className="placeholder-value" />
            <span className="placeholder-line" />
          </div>
        ))}
      </div>
      <div className="charts-grid" aria-hidden="true">
        {[0, 1].map((item) => (
          <div className="panel placeholder-chart" key={item}>
            <span className="placeholder-line" />
          </div>
        ))}
      </div>
    </div>
  );
}
