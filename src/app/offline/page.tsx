'use client';

export default function OfflinePage() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100dvh', background: '#0F1A2E', color: '#fff', padding: 24, textAlign: 'center',
    }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>📡</div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>You&apos;re Offline</h1>
      <p style={{ color: '#8E99A8', fontSize: 14, maxWidth: 300 }}>
        Please check your internet connection and try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          marginTop: 24, padding: '12px 32px', background: '#C8102E', color: '#fff',
          border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer',
        }}
      >
        Retry
      </button>
    </div>
  );
}
