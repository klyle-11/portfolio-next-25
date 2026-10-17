import { useEffect, useState } from 'react';
import { getHealth } from './api';
import Workspace from './components/Workspace';

export default function App() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getHealth().then(setHealth).catch(err => setError(err.message));
  }, []);

  if (error || (health && !health.configured)) {
    return (
      <div className="center-screen">
        <div className="card">
          <h1>Almost there</h1>
          {error ? (
            <p>Can't reach the local admin server: {error}. Start it with <code>npm run dev</code> in <code>admin/</code>.</p>
          ) : (
            <p>Copy <code>admin/.env.example</code> to <code>admin/.env</code>, fill in your Supabase URL and service role key, then restart.</p>
          )}
        </div>
      </div>
    );
  }

  if (!health) return null;
  return <Workspace siteUrl={health.siteUrl} />;
}
