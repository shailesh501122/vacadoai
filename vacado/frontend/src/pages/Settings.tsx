import { useEffect, useState } from 'react';
import { Key, Trash2, Copy, Plus, Sparkles, Save, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiKeysApi, adminApi } from '../api/endpoints';

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

      {user?.isAdmin && <AIProvidersCard />}

      <div className="card">
        <div className="card-head">
          <div><h3>Vacado API Keys</h3><div className="sub">Programmatic access (Pro & Agency)</div></div>
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

interface MaskedSetting { key: string; isSet: boolean; preview: string; fromDb: boolean; }

function AIProvidersCard() {
  const [state, setState] = useState<MaskedSetting[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const load = () =>
    adminApi.getSettings().then((d) => setState(d.settings ?? [])).catch(() => undefined);
  useEffect(() => { load(); }, []);

  const FIELDS: { key: string; label: string; placeholder: string; hint?: string }[] = [
    { key: 'OPENAI_API_KEY', label: 'Script API key', placeholder: 'gsk_… (Groq) or sk-… (OpenAI)', hint: 'Used to generate the narration script.' },
    { key: 'OPENAI_BASE_URL', label: 'Script API base URL', placeholder: 'https://api.groq.com/openai/v1', hint: 'Leave blank for OpenAI; set https://api.groq.com/openai/v1 for Groq.' },
    { key: 'OPENAI_MODEL', label: 'Script model', placeholder: 'llama-3.3-70b-versatile', hint: 'gpt-4o, llama-3.3-70b-versatile, gemini-1.5-flash, etc.' },
    { key: 'ELEVENLABS_API_KEY', label: 'Voiceover API key (ElevenLabs)', placeholder: 'sk_…', hint: 'Free tier: ~10,000 characters/month.' },
  ];

  const save = async () => {
    setBusy(true); setMsg(null);
    try {
      const d = await adminApi.updateSettings(form);
      setState(d.settings ?? []);
      setForm({});
      setMsg({ kind: 'ok', text: 'Saved. New requests use these keys within ~30 seconds.' });
    } catch (e: any) {
      setMsg({ kind: 'err', text: e.response?.data?.error ?? 'Could not save' });
    } finally { setBusy(false); }
  };

  const current = (key: string) => state.find((s) => s.key === key);

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} style={{ color: 'var(--red)' }} /> AI Providers
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: 'var(--red)', background: 'var(--red-soft)', border: '1px solid var(--red-border)', padding: '2px 8px', borderRadius: 999 }}>
              <ShieldCheck size={11} /> Admin only
            </span>
          </h3>
          <div className="sub">Hot-reloadable LLM & TTS keys — saved to the database, no redeploy needed.</div>
        </div>
        <button className="btn primary sm" onClick={save} disabled={busy || Object.keys(form).length === 0}>
          <Save size={14} /> {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {msg && (
          <div style={{ fontSize: 13, color: msg.kind === 'ok' ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>
            {msg.text}
          </div>
        )}
        {FIELDS.map((f) => {
          const c = current(f.key);
          return (
            <div className="field" key={f.key}>
              <label>
                {f.label}
                {c?.isSet && (
                  <span style={{ marginLeft: 8, fontSize: 11.5, color: 'var(--green)', fontWeight: 600 }}>
                    ✓ set ({c.preview}{c.fromDb ? '' : ' · from env'})
                  </span>
                )}
              </label>
              <input
                className="input"
                type={f.key.includes('KEY') ? 'password' : 'text'}
                placeholder={f.placeholder}
                value={form[f.key] ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                autoComplete="off"
              />
              {f.hint && <div className="hint">{f.hint}</div>}
            </div>
          );
        })}
        <div style={{ fontSize: 12, color: 'var(--faint)', lineHeight: 1.5 }}>
          Leave a field blank to keep the current value; submit an empty string by saving an empty value (clears the DB row and falls back to env). Keys are write-only — they aren't returned, only previewed.
        </div>
      </div>
    </div>
  );
}
