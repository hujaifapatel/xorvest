import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useWizard } from '../components/Wizard.jsx';
import { rupees, cover } from '../lib/format.js';

export default function Account() {
  const { user } = useAuth();
  const { start } = useWizard();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.assessments().then(setItems).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="wrap" style={{ paddingBottom: 72, maxWidth: 900 }}>
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1>Hi {user.name.split(' ')[0]}</h1>
          <p>Your saved health insurance recommendations.</p>
        </div>
        <button className="btn accent" onClick={() => start()}>New recommendation</button>
      </div>
      {error && <div className="alert">{error}</div>}
      {!items && !error && <div className="loading">Loading…</div>}
      {items && !items.length && (
        <div className="empty">
          <h3>No recommendations yet</h3>
          <p>Answer a few questions and we’ll compare plans for your family.</p>
          <button className="btn" onClick={() => start()}>Get started</button>
        </div>
      )}
      {items && items.length > 0 && (
        <div className="history">
          {items.map((it) => (
            <div className="history-item" key={it.id}>
              <div>
                <h3>Cover of {cover(it.profile.recommendedSumInsured)} for {it.profile.lives} member{it.profile.lives > 1 ? 's' : ''}</h3>
                <p>
                  {new Date(it.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {it.top[0] && <> · Top pick: {it.top[0].insurer} {it.top[0].name} at {rupees(it.top[0].monthly)}/month</>}
                </p>
              </div>
              <Link className="btn outline sm" to={`/plans/${it.id}`}>View plans</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
