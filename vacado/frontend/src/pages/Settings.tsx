import { useEffect, useState } from 'react';
import { Key, Trash2, Copy, Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiKeysApi } from '../api/endpoints';

export default function Settings() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<any[]>([]);
  const [newKey, setNewKey] = useState('');
  const [name, setName] = useState('');
  const [apiErr, setApiErr] = useState('');

  const load = () => apiKeysApi.list().then((d) => setKeys(d.keys ?? [])).catch(() => setApiErr('API keys require a Pro or Agency plan.'));
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name.trim()) return;
    try {
      const { key } = await apiKeysApi.create(name.trim());
      setNewKey(key);
      setName('');
      load();
    } catch { setApiErr('Could not create key — plan may not include API access.'); }
  };
  const revoke = async (id: string) => { await apiKeysApi.revoke(id).catch(() => undefined); load(); };

  return (
    <>
      <div className="row r2" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <div className="card-head"><div><h3>Account</h3><div className="sub">Your profile information</div></div></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="field"><label>Full name</label><input className="input" defaultValue={user?.name ?? ''} /></div>
            <div className="field"><label>Email</label><input className="input" defaultValue={user?.email ?? ''} disabled /></div>
            <button className="btn primary" style={{ alignSelf: 'flex-start' }}>Save Changes</button>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><div><h3>Change Password</h3><div className="sub">Use 8+ characters</div></div></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="field"><label>Current password</label><input className="input" type="password" /></div>
            <div className="field"><label>New password</label><input className="input" type="password" /></div>
            <button className="btn primary" style={{ alignSelf: 'flex-start' }}>Update Password</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div><h3>API Keys</h3><div className="sub">Programmatic access (Pro & Agency)</div></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="input" style={{ width: 180, height: 32 }} placeholder="Key name" value={name} onChange={(e) => setName(e.target.value)} />
            <button className="btn primary sm" onClick={create}><Plus size={14} /> Create</button>
          </div>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {apiErr && <div style={{ color: 'var(--red)', fontSize: 13 }}>{apiErr}</div>}
          {newKey && (
            <div style={{ background: 'var(--red-soft)', border: '1px solid var(--red-border)', borderRadius: 8, padding: 12, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
              <Key size={16} style={{ color: 'var(--red)' }} />
              <code style={{ flex: 1 }}>{newKey}</code>
              <button className="act-btn" onClick={() => navigator.clipboard.writeText(newKey)}><Copy size={15} /></button>
            </div>
          )}
          {keys.length === 0 && !apiErr && <div style={{ color: 'var(--faint)', fontSize: 13 }}>No API keys yet.</div>}
          {keys.map((k) => (
            <div key={k.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-soft)' }}>
              <Key size={16} style={{ color: 'var(--muted)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{k.name}</div>
                <div style={{ fontSize: 12, color: 'var(--faint)' }}>{k.prefix}··· · created {new Date(k.createdAt).toLocaleDateString()}</div>
              </div>
              <button className="act-btn" onClick={() => revoke(k.id)}><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><div><h3>Team Members</h3><div className="sub">Agency plan — invite seats & assign roles</div></div><button className="btn outline sm"><Plus size={14} /> Invite</button></div>
        <table className="tbl">
          <thead><tr><th style={{ paddingLeft: 22 }}>Member</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
          <tbody>
            {[
              ['Marco Reyes', 'demo@vacado.app', 'Owner', 'Active'],
              ['Priya Sharma', 'priya@vacado.app', 'Editor', 'Active'],
              ['Jonas Klein', 'jonas@vacado.app', 'Viewer', 'Invited'],
            ].map(([n, e, role, st]) => (
              <tr key={e}>
                <td style={{ paddingLeft: 22, fontWeight: 500 }}>{n}</td>
                <td><span style={{ color: 'var(--muted)' }}>{e}</span></td>
                <td>{role}</td>
                <td><span className={`pill ${st === 'Active' ? 'green' : 'blue'}`}>{st}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
