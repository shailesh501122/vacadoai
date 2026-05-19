import { Eye, Pencil, Trash2 } from 'lucide-react';

const STATUS_CLS: Record<string, string> = {
  PUBLISHED: 'green', PROCESSING: 'amber', SCHEDULED: 'blue',
  FAILED: 'red', PENDING: 'amber',
};
const LANG_CODE: Record<string, string> = {
  Spanish: 'es', Hindi: 'hi', French: 'fr', Arabic: 'ar', Portuguese: 'pt',
  German: 'de', Italian: 'it', Japanese: 'ja', Korean: 'ko', Russian: 'ru',
  Turkish: 'tr', English: 'en',
};
const COLORS = ['#7c3aed', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#6366f1'];

export interface ShortRow {
  id: string;
  title?: string | null;
  movieTitle: string;
  language: string;
  status: string;
  views: number;
  createdAt: string;
  duration?: number;
}

export default function ShortsTable({
  rows, onView, onDelete,
}: {
  rows: ShortRow[];
  onView?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <table className="tbl">
      <thead>
        <tr>
          <th style={{ paddingLeft: 22 }}>Short</th>
          <th>Movie</th>
          <th>Language</th>
          <th>Status</th>
          <th>Views</th>
          <th>Created</th>
          <th style={{ textAlign: 'right', paddingRight: 22 }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--faint)', padding: 40 }}>No Shorts yet — generate your first one.</td></tr>
        )}
        {rows.map((r, i) => {
          const initials = r.movieTitle.replace(/[^A-Za-z ]/g, '').split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase();
          return (
            <tr key={r.id}>
              <td>
                <div className="title-cell">
                  <div className="thumb" style={{ background: COLORS[i % COLORS.length] }}>{initials}</div>
                  <div>
                    <div className="ti-text">{r.title || `${r.movieTitle} Explained`}</div>
                    <div className="ti-sub">Short · {r.duration ?? 60}s</div>
                  </div>
                </div>
              </td>
              <td><span style={{ color: 'var(--muted)' }}>{r.movieTitle}</span></td>
              <td>
                <span className="lang-cell">
                  <span className={`flag ${LANG_CODE[r.language] ?? 'en'}`} /> {r.language}
                </span>
              </td>
              <td><span className={`pill ${STATUS_CLS[r.status] ?? 'amber'}`}>{r.status[0] + r.status.slice(1).toLowerCase()}</span></td>
              <td><b>{r.views ? r.views.toLocaleString() : '—'}</b></td>
              <td><span style={{ color: 'var(--muted)' }}>{new Date(r.createdAt).toLocaleDateString()}</span></td>
              <td>
                <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                  <button className="act-btn" title="View" onClick={() => onView?.(r.id)}><Eye size={16} /></button>
                  <button className="act-btn" title="Edit"><Pencil size={16} /></button>
                  <button className="act-btn" title="Delete" onClick={() => onDelete?.(r.id)}><Trash2 size={16} /></button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
