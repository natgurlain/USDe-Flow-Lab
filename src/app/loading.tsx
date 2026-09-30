export default function Loading() {
  return (
    <main className="loading-screen" aria-live="polite">
      <span className="brand-symbol">e≋</span>
      <h1>Ethena Explained</h1>
      <p>Checking public sources…</p>
      <small>Each reading will show its source and observation date.</small>
    </main>
  );
}
