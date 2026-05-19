import { useEffect, useState } from 'react';
import { Youtube, MoreVertical, Clock, Settings as Cog, Plus, CheckCircle2 } from 'lucide-react';
import { channelsApi } from '../api/endpoints';

const FALLBACK = [
  { id: 1, channelName: '@CinemaShorts', handle: 'cinemashorts', subscriberCount: 1200000, _count: { shorts: 284 }, isActive: true },
  { id: 2, channelName: '@MoviePulse_ES', handle: 'moviepulse_es', subscriberCount: 480000, _count: { shorts: 142 }, isActive: true },
  { id: 3, channelName: '@FilmDecoded_HI', handle: 'filmdecoded', subscriberCount: 720000, _count: { shorts: 198 }, isActive: true },
  { id: 4, channelName: '@CinemaInsight_FR', handle: 'cinema_insight', subscriberCount: 312000, _count: { shorts: 96 }, isActive: false },
  { id: 5, channelName: '@FilmTwist_DE', handle: 'filmtwist_de', subscriberCount: 168000, _count: { shorts: 54 }, isActive: false },
];
const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#6366f1'];
const fmt = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}K` : `${n}`);

export default function Channels() {
  const [channels, setChannels] = useState<any[]>([]);
  const [modal, setModal] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = () =>
    channelsApi.list()
      .then((d) => setChannels(d.channels?.length ? d.channels : FALLBACK))
      .catch(() => setChannels(FALLBACK))
      .finally(() => setLoaded(true));

  useEffect(() => { load(); }, []);

  const toggle = async (id: any) => {
    setChannels((cs) => cs.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c)));
    if (loaded && typeof id === 'string') await channelsApi.toggle(id).catch(() => undefined);
  };

  const connect = async () => {
    try {
      const { url } = await channelsApi.connect();
      window.location.href = url;
    } catch {
      setModal(true);
    }
  };

  const totalSubs = channels.reduce((s, c) => s + (c.subscriberCount ?? 0), 0);

  return (
    <>
      <div className="card" style={{ padding: '22px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,auto)', gap: 32, flex: 1 }}>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Connected</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{channels.length} <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>/ 5 channels</span></div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Active</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>{channels.filter((c) => c.isActive).length}</div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Total Subscribers</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{fmt(totalSubs)}</div>
          </div>
        </div>
        <button className="btn outline-red" onClick={connect}><Plus size={16} /> Connect New Channel</button>
      </div>

      <div className="row r3">
        {channels.map((c, i) => (
          <div key={c.id} className="ch-card">
            <div className="head">
              <div className="av" style={{ background: COLORS[i % COLORS.length] }}>{(c.channelName ?? 'C')[1]?.toUpperCase() ?? 'C'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="nm">{c.channelName}</div>
                <div className="hd"><Youtube size={14} style={{ color: 'var(--red)' }} /> youtube.com/{c.handle ?? c.channelName?.replace('@', '')}</div>
              </div>
              <button className="act-btn"><MoreVertical size={16} /></button>
            </div>
            <div className="ch-stats">
              <div className="it"><b>{fmt(c.subscriberCount ?? 0)}</b><span>Subscribers</span></div>
              <div className="it"><b>{c._count?.shorts ?? 0}</b><span>Shorts</span></div>
              <div className="it"><b>{c.isActive ? '2' : '1'}</b><span>Languages</span></div>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={14} /> Last upload: <b style={{ color: 'var(--text)', fontWeight: 500 }}>2 hours ago</b>
            </div>
            <div className="foot">
              <div className="toggle-label">
                <div className={`switch ${c.isActive ? 'on' : ''}`} onClick={() => toggle(c.id)} />
                <span><b>{c.isActive ? 'Active' : 'Paused'}</b></span>
              </div>
              <button className="btn outline sm"><Cog size={14} /> Settings</button>
            </div>
          </div>
        ))}

        <div onClick={connect} style={{
          background: 'transparent', border: '2px dashed var(--border)', borderRadius: 12, padding: 22,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: 240, cursor: 'pointer', gap: 10, color: 'var(--muted)',
        }}>
          <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'var(--red-soft)', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={26} /></div>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>Connect New Channel</div>
          <div style={{ fontSize: 12.5, textAlign: 'center', maxWidth: 200 }}>Authorize via YouTube OAuth to add another channel</div>
        </div>
      </div>

      {modal && (
        <div className="modal-bd" onClick={() => setModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="yt-logo"><Youtube size={32} /></div>
            <h2>Connect YouTube Channel</h2>
            <p className="desc">Vacado needs permission to manage your YouTube content. We'll never post without your explicit approval.</p>
            {[
              ['Upload videos to your channel', 'Publish Shorts you generate via Vacado'],
              ['Manage metadata & captions', 'Set titles, descriptions, tags, and multi-language captions'],
              ['Read channel analytics', 'Views, watch-time, and revenue for your dashboard'],
            ].map(([t, d]) => (
              <div className="perm" key={t}>
                <CheckCircle2 size={20} />
                <div><div className="pt">{t}</div><div className="pd">{d}</div></div>
              </div>
            ))}
            <div className="modal-actions">
              <button className="btn outline" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn primary" onClick={connect}><Youtube size={16} /> Connect with YouTube</button>
            </div>
            <p style={{ textAlign: 'center', color: 'var(--faint)', fontSize: 11.5, margin: '14px 0 0' }}>You can revoke access anytime from your Google account settings</p>
          </div>
        </div>
      )}
    </>
  );
}
