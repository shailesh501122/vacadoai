import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import ShortsTable from '../components/ShortsTable';
import { useShorts } from '../hooks/useShorts';
import { shortsApi } from '../api/endpoints';

const STATUSES = ['', 'PUBLISHED', 'PROCESSING', 'SCHEDULED', 'FAILED', 'PENDING'];

export default function MyShorts() {
  const nav = useNavigate();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { items, total, pages, loading, reload } = useShorts({
    status: status || undefined,
    page,
    limit: 10,
  });

  const del = async (id: string) => {
    await shortsApi.remove(id).catch(() => undefined);
    reload();
  };

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h3>My Shorts</h3>
          <div className="sub">{loading ? 'Loading…' : `${total} total`}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="toggle-pills">
            {STATUSES.map((s) => (
              <button key={s || 'all'} className={status === s ? 'on' : ''} onClick={() => { setStatus(s); setPage(1); }}>
                {s ? s[0] + s.slice(1).toLowerCase() : 'All'}
              </button>
            ))}
          </div>
          <button className="btn primary sm" onClick={() => nav('/dashboard/generate')}>
            <Plus size={15} /> New Short
          </button>
        </div>
      </div>
      <ShortsTable rows={items} onDelete={del} onView={(id) => nav(`/dashboard/shorts?id=${id}`)} />
      <div className="pagination">
        <div>Page <b style={{ color: 'var(--text)' }}>{page}</b> of <b style={{ color: 'var(--text)' }}>{pages || 1}</b></div>
        <div className="pg-btns">
          <button className="pg-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>‹</button>
          <button className="pg-btn active">{page}</button>
          <button className="pg-btn" disabled={page >= (pages || 1)} onClick={() => setPage((p) => p + 1)}>›</button>
        </div>
      </div>
    </div>
  );
}
