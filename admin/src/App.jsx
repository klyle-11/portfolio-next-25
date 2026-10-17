import { useEffect, useState } from 'react';
import { getHealth } from './api';
import Workspace from './components/Workspace';
import SiteHeader from './components/SiteHeader';
import SiteFooter from './components/SiteFooter';

export default function App() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getHealth().then(setHealth).catch(err => setError(err.message));
  }, []);

  const siteUrl = health?.siteUrl || '';
  let body = null;

  if (error || (health && !health.configured)) {
    body = (
      <div className="center-screen">
        <div className="card">
          <h1>Almost there</h1>
          {error ? (
            <p>Can't reach the local admin server: {error}. Start it with <code>npm run admin</code> from the repo root.</p>
          ) : (
            <p>Copy <code>admin/.env.example</code> to <code>admin/.env</code>, fill in your Supabase URL and service role key, then restart.</p>
          )}
        </div>
      </div>
    );
  } else if (health) {
    body = <Workspace siteUrl={siteUrl} />;
  }

  return (
    <div className="shell">
      <SiteHeader siteUrl={siteUrl} />
      <div className="shell-body">{body}</div>
      <SiteFooter siteUrl={siteUrl} />
    </div>
  );
}
