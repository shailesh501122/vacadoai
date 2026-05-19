import { Crown, ArrowUp, Zap, Check, Download, CreditCard, Plus, AlertTriangle, FileDown } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { subsApi } from '../api/endpoints';

const INVOICES = [
  { date: 'May 1, 2026', id: 'INV-2026-051', amt: '$79.00', status: 'Paid' },
  { date: 'Apr 1, 2026', id: 'INV-2026-042', amt: '$79.00', status: 'Paid' },
  { date: 'Mar 1, 2026', id: 'INV-2026-033', amt: '$79.00', status: 'Paid' },
  { date: 'Feb 1, 2026', id: 'INV-2026-024', amt: '$79.00', status: 'Paid' },
  { date: 'Jan 1, 2026', id: 'INV-2026-015', amt: '$79.00', status: 'Paid' },
  { date: 'Dec 18, 2025', id: 'INV-2025-298', amt: '$79.00', status: 'Failed' },
  { date: 'Dec 1, 2025', id: 'INV-2025-282', amt: '$79.00', status: 'Paid' },
];

export default function Subscription() {
  const sub = useSubscription();
  const s = sub.subscription;
  const pct = (used: number, lim: number) => (lim <= 0 ? 0 : Math.min(100, (used / lim) * 100));
  const shortsUsed = s?.shortsUsed ?? 94;
  const shortsLimit = s?.shortsLimit > 0 ? s.shortsLimit : 150;

  const upgrade = async () => {
    try {
      const { url } = await subsApi.checkout('AGENCY');
      window.location.href = url;
    } catch { /* Stripe not configured in demo */ }
  };
  const manage = async () => {
    try {
      const { url } = await subsApi.portal();
      window.location.href = url;
    } catch { /* noop */ }
  };

  return (
    <>
      <div className="row r2" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
        <div className="plan-card">
          <span className="crown"><Crown size={14} /> Current Plan</span>
          <h2>{s?.plan ? s.plan[0] + s.plan.slice(1).toLowerCase() : 'Pro'}</h2>
          <div className="renew">Renews on <b style={{ color: 'var(--text)' }}>June 1, 2026</b> · Auto-renewal on</div>
          <div className="price"><b>${sub.plan?.priceMonthly ?? 79}</b><span>/month</span></div>
          <div className="divider" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 10 }}>
            <div className="usage-row">
              <div className="top"><b>Shorts Used</b><span>{shortsUsed} / {shortsLimit} this month</span></div>
              <div className="bar"><div className="fill" style={{ width: `${pct(shortsUsed, shortsLimit)}%` }} /></div>
            </div>
            <div className="usage-row">
              <div className="top"><b>Connected Channels</b><span>3 / {s?.channelLimit ?? 5}</span></div>
              <div className="bar"><div className="fill" style={{ width: `${pct(3, s?.channelLimit ?? 5)}%` }} /></div>
            </div>
            <div className="usage-row">
              <div className="top"><b>Languages</b><span>12 / {s?.languageLimit ?? 25}</span></div>
              <div className="bar"><div className="fill" style={{ width: `${pct(12, s?.languageLimit ?? 25)}%` }} /></div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button className="btn primary" onClick={upgrade}><ArrowUp size={16} /> Upgrade Plan</button>
            <button className="btn outline" onClick={manage}>Manage</button>
          </div>
        </div>

        <div className="card pad" style={{ background: '#0F0F0F', color: '#fff', border: 'none', display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', width: 160, height: 160, background: 'var(--red)', borderRadius: '50%', top: -60, right: -60, opacity: 0.4, filter: 'blur(40px)' }} />
          <div style={{ position: 'relative' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--red)', color: '#fff', fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 999, letterSpacing: '.04em', textTransform: 'uppercase' }}><Zap size={13} /> Recommended</span>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: '14px 0 6px', color: '#fff' }}>Upgrade to Agency</h2>
            <p style={{ margin: 0, fontSize: 13.5, color: '#bdbdbd', lineHeight: 1.55 }}>Unlimited Shorts, 50+ languages, 20 channels, and white-label exports for your team.</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '18px 0', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              {['Unlimited Shorts / month', '20 YouTube channels', 'Team seats & roles'].map((x) => (
                <li key={x} style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Check size={18} style={{ color: 'var(--red)' }} /> {x}</li>
              ))}
            </ul>
            <button className="btn primary full" onClick={upgrade}>Upgrade for $199/mo</button>
          </div>
        </div>
      </div>

      <div className="row r2" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
        <div className="card">
          <div className="card-head">
            <div><h3>Billing History</h3><div className="sub">All invoices · auto-charged to card on file</div></div>
            <button className="btn outline sm"><Download size={14} /> Export CSV</button>
          </div>
          <table className="tbl">
            <thead><tr>
              <th style={{ paddingLeft: 22 }}>Date</th><th>Invoice ID</th><th>Amount</th><th>Status</th><th style={{ textAlign: 'right', paddingRight: 22 }}>Receipt</th>
            </tr></thead>
            <tbody>
              {INVOICES.map((r) => (
                <tr key={r.id}>
                  <td style={{ paddingLeft: 22 }}>{r.date}</td>
                  <td><span style={{ fontFamily: 'monospace', color: 'var(--muted)', fontSize: 12.5 }}>{r.id}</span></td>
                  <td><b>{r.amt}</b></td>
                  <td><span className={`pill ${r.status === 'Paid' ? 'green' : 'red'}`}>{r.status}</span></td>
                  <td style={{ textAlign: 'right', paddingRight: 22 }}><button className="act-btn" title="Download PDF"><FileDown size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div className="card-head"><div><h3>Payment Method</h3><div className="sub">Charged on the 1st of each month</div></div></div>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0' }}>
                <div style={{ width: 54, height: 34, background: 'linear-gradient(135deg,#1a1f71,#3a4ba8)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12, letterSpacing: '.05em', fontStyle: 'italic' }}>VISA</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Visa ending in 4242</div>
                  <div style={{ fontSize: 12.5, color: 'var(--faint)', marginTop: 2 }}>Expires 04/2028 · Default</div>
                </div>
              </div>
              <button className="btn outline full" style={{ marginTop: 8 }} onClick={manage}><CreditCard size={16} /> Change Card</button>
              <button className="btn ghost full" style={{ marginTop: 8 }}><Plus size={16} /> Add backup payment method</button>
            </div>
          </div>
          <div className="card pad">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <AlertTriangle size={22} style={{ color: 'var(--red)' }} />
              <h3 style={{ fontSize: 15, margin: 0 }}>Cancel subscription</h3>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.55, margin: '0 0 14px' }}>Your published Shorts and analytics history will stay accessible. You'll lose access to scheduled uploads at the end of the current billing cycle.</p>
            <a href="#" onClick={(e) => { e.preventDefault(); manage(); }} style={{ color: 'var(--red)', fontSize: 13, fontWeight: 500, opacity: 0.85 }}>Cancel subscription →</a>
          </div>
        </div>
      </div>
    </>
  );
}
