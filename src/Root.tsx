import { Suspense, lazy, useEffect, useState } from 'react';
import App from './App';
import { hasOwnerCandidate, resolveOwnerRoute } from './services/ownerGate';

// Loaded as a separate chunk: normal visitors never download the owner console code.
const OwnerAdminPanel = lazy(() => import('./components/admin/OwnerAdminPanel'));

const OwnerSplash = () => <div style={{ minHeight: '100vh', backgroundColor: '#0B0B0F' }} />;

export function Root() {
  const [mode, setMode] = useState<'checking' | 'owner' | 'app'>(() => (hasOwnerCandidate() ? 'checking' : 'app'));

  useEffect(() => {
    if (mode !== 'checking') return;
    resolveOwnerRoute().then((ok) => setMode(ok ? 'owner' : 'app'));
  }, [mode]);

  if (mode === 'checking') return <OwnerSplash />;
  if (mode === 'owner') {
    return (
      <Suspense fallback={<OwnerSplash />}>
        <OwnerAdminPanel />
      </Suspense>
    );
  }
  return <App />;
}
