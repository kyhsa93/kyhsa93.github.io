export function RouteLoading() {
  return (
    <div
      role="status"
      aria-label="Loading"
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--muted)',
        fontSize: '0.9rem',
      }}
    >
      Loading…
    </div>
  );
}
