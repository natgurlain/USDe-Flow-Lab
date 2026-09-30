"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="loading-screen">
      <h1>This view couldn’t load.</h1>
      <p>Try again to reload the dashboard.</p>
      <button className="refresh-button" type="button" onClick={reset}>
        Try again
      </button>
      <a href="/learn">Read the basics</a>
    </main>
  );
}
