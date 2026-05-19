import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check, Search, Link2, ArrowRight, ArrowLeft, X, Plus, Zap,
  MessageSquare, Sparkles, Flag, Calendar, Clock, RefreshCw, Play,
} from 'lucide-react';
import { shortsApi } from '../api/endpoints';

const MOVIES = [
  { title: 'Inception', year: '2010', color: '#7c3aed', initials: 'IN' },
  { title: 'Interstellar', year: '2014', color: '#3b82f6', initials: 'IF' },
  { title: 'The Dark Knight', year: '2008', color: '#0F0F0F', initials: 'DK' },
  { title: 'Oppenheimer', year: '2023', color: '#6366f1', initials: 'OP' },
  { title: 'Parasite', year: '2019', color: '#10b981', initials: 'PR' },
];
const LANGUAGES = [
  { code: 'es', name: 'Spanish' }, { code: 'hi', name: 'Hindi' }, { code: 'fr', name: 'French' },
  { code: 'ar', name: 'Arabic' }, { code: 'pt', name: 'Portuguese' }, { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' }, { code: 'ja', name: 'Japanese' }, { code: 'ko', name: 'Korean' },
  { code: 'ru', name: 'Russian' }, { code: 'tr', name: 'Turkish' }, { code: 'en', name: 'English' },
];

export default function Generate() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [movie, setMovie] = useState('Inception');
  const [focus, setFocus] = useState(false);
  const [picked, setPicked] = useState(MOVIES[0]);
  const [langs, setLangs] = useState(['es', 'hi']);
  const [clipStyle, setClipStyle] = useState('plot-twist');
  const [tone, setTone] = useState('dramatic');
  const [duration, setDuration] = useState('60s');
  const [voice, setVoice] = useState('male');
  const [title, setTitle] = useState('The Inception Ending Explained — Was It All a Dream?');
  const [tags, setTags] = useState('#inception #moviedecoded #cinemashort #dicaprio #christophernolan #endingexplained');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');


  const toggleLang = (c: string) =>
    setLangs((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));
  const stepStatus = (n: number) => (n < step ? 'done' : n === step ? 'active' : '');

  const submit = async () => {
    setBusy(true);
    setMsg('');
    try {
      const langName = LANGUAGES.find((l) => l.code === langs[0])?.name ?? 'Spanish';
      await shortsApi.generate({
        movieTitle: picked.title,
        language: langName,
        clipStyle, tone,
        duration: parseInt(duration, 10),
        voice, title, hashtags: tags,
      });
      setMsg('Queued! Generating your Short…');
      setTimeout(() => nav('/dashboard/shorts'), 1200);
    } catch (e: any) {
      setMsg(e.response?.data?.error ?? 'Failed to queue generation');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="steps-pill" style={{ paddingTop: 18, paddingBottom: 18 }}>
          <div className={`sp ${stepStatus(1)}`}><span className="n">{step > 1 ? <Check size={13} /> : '1'}</span> Movie Selection</div>
          <div className="sp-divider" />
          <div className={`sp ${stepStatus(2)}`}><span className="n">{step > 2 ? <Check size={13} /> : '2'}</span> Short Configuration</div>
          <div className="sp-divider" />
          <div className={`sp ${stepStatus(3)}`}><span className="n">3</span> Review Metadata</div>
        </div>
      </div>

      {step === 1 && (
        <div className="card">
          <div className="card-head"><div><h3>Step 1 — Pick a movie</h3><div className="sub">Search by title, or paste a YouTube / IMDB URL</div></div></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="field">
              <label>Movie title</label>
              <div className="input-ic">
                <Search size={18} />
                <input className="input" placeholder="Enter movie title..." value={movie}
                  onChange={(e) => setMovie(e.target.value)}
                  onFocus={() => setFocus(true)} onBlur={() => setTimeout(() => setFocus(false), 150)} />
              </div>
              {focus && (
                <div className="suggest">
                  {MOVIES.filter((m) => m.title.toLowerCase().includes(movie.toLowerCase())).map((m) => (
                    <div key={m.title} className="suggest-item" onClick={() => { setPicked(m); setMovie(m.title); setFocus(false); }}>
                      <div className="thumb" style={{ background: m.color }}>{m.initials}</div>
                      <div style={{ flex: 1 }}><div className="ti">{m.title}</div><div className="yr">{m.year} · Feature film</div></div>
                      <ArrowRight size={16} style={{ color: 'var(--faint)' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: 'var(--faint)', fontSize: 12, fontWeight: 500 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} /> OR <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
            <div className="field">
              <label>Paste YouTube or IMDB URL</label>
              <div className="input-ic"><Link2 size={18} /><input className="input" placeholder="https://www.imdb.com/title/..." /></div>
            </div>
            <div style={{ background: 'var(--red-soft)', border: '1px solid var(--red-border)', borderRadius: 10, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="thumb" style={{ width: 64, height: 88, background: picked.color, fontSize: 14 }}>{picked.initials}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Selected</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{picked.title} <span style={{ color: 'var(--muted)', fontWeight: 500 }}>({picked.year})</span></div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Sci-fi · 2h 28m · Available in 47 source clips</div>
              </div>
              <Check size={24} style={{ color: 'var(--red)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
              <button className="btn primary" onClick={() => setStep(2)}>Continue <ArrowRight size={16} /></button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card">
          <div className="card-head"><div><h3>Step 2 — Configure your Short</h3><div className="sub">Tune languages, clip style, voice and length</div></div></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="field">
              <label>Languages <span style={{ color: 'var(--faint)', fontWeight: 400, marginLeft: 4 }}>(50+ supported — picked {langs.length})</span></label>
              <div className="chip-row">
                {langs.map((c) => {
                  const l = LANGUAGES.find((x) => x.code === c);
                  return l ? (
                    <span key={c} className="chip"><span className={`flag ${c}`} /> {l.name}
                      <span className="x" onClick={() => toggleLang(c)}><X size={12} /></span></span>
                  ) : null;
                })}
                <span className="chip" style={{ background: '#fff', color: 'var(--muted)', borderColor: 'var(--border)', cursor: 'pointer' }}><Plus size={14} /> Add language</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                {LANGUAGES.filter((l) => !langs.includes(l.code)).slice(0, 8).map((l) => (
                  <button key={l.code} className="chip" style={{ background: '#fff', color: 'var(--muted)', borderColor: 'var(--border)', cursor: 'pointer' }} onClick={() => toggleLang(l.code)}>
                    <span className={`flag ${l.code}`} /> {l.name} <Plus size={14} />
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Clip style</label>
              <div className="rcards">
                {[
                  { id: 'action', I: Zap, t: 'Action', d: 'High-energy fights & chases' },
                  { id: 'dialogue', I: MessageSquare, t: 'Dialogue', d: 'Iconic line or monologue' },
                  { id: 'plot-twist', I: Sparkles, t: 'Plot Twist', d: 'Reveal & shock moments' },
                  { id: 'ending', I: Flag, t: 'Ending', d: 'Final scene breakdowns' },
                ].map((o) => (
                  <div key={o.id} className={`rcard ${clipStyle === o.id ? 'on' : ''}`} onClick={() => setClipStyle(o.id)}>
                    <o.I size={24} /><div className="ti">{o.t}</div><div className="ds">{o.d}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
              <div className="field"><label>Script tone</label>
                <div className="toggle-pills">
                  {['dramatic', 'casual', 'educational'].map((o) => (
                    <button key={o} className={tone === o ? 'on' : ''} onClick={() => setTone(o)}>{o[0].toUpperCase() + o.slice(1)}</button>
                  ))}
                </div>
              </div>
              <div className="field"><label>Duration</label>
                <div className="toggle-pills">
                  {['30s', '45s', '60s'].map((o) => (
                    <button key={o} className={duration === o ? 'on' : ''} onClick={() => setDuration(o)}>{o}</button>
                  ))}
                </div>
              </div>
              <div className="field"><label>Voice</label>
                <div className="toggle-pills">
                  {[['male', 'Male'], ['female', 'Female'], ['clone', 'AI Clone']].map(([v, l]) => (
                    <button key={v} className={voice === v ? 'on' : ''} onClick={() => setVoice(v)}>{l}</button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 6 }}>
              <button className="btn outline" onClick={() => setStep(1)}><ArrowLeft size={16} /> Back</button>
              <button className="btn primary" onClick={() => setStep(3)}>Continue <ArrowRight size={16} /></button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="row r2" style={{ marginBottom: 0 }}>
          <div className="card">
            <div className="card-head"><div><h3>Step 3 — Review Metadata</h3><div className="sub">Review your auto-generated title and hashtags</div></div></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="field">
                <label>Title <span style={{ color: 'var(--faint)', fontWeight: 400 }}>· auto-generated, editable</span></label>
                <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="field">
                <label>Hashtags</label>
                <textarea className="textarea" value={tags} onChange={(e) => setTags(e.target.value)} rows={3} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <button className="btn outline" onClick={() => setStep(2)}><ArrowLeft size={16} /> Back</button>
              </div>
            </div>
          </div>

          <div className="card" style={{ height: 'fit-content', position: 'sticky', top: 92 }}>
            <div className="card-head">
              <div><h3>Thumbnail preview</h3><div className="sub">AI-generated · 1080×1920</div></div>
              <button className="act-btn"><RefreshCw size={16} /></button>
            </div>
            <div className="card-body">
              <div style={{ aspectRatio: '9/16', borderRadius: 10, background: 'radial-gradient(circle at 30% 30%, rgba(255,0,0,.55), transparent 60%), radial-gradient(circle at 70% 70%, rgba(255,80,80,.45), transparent 55%), #1a0606', position: 'relative', overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(255,0,0,.95)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '5px 9px', borderRadius: 999, letterSpacing: '.05em', textTransform: 'uppercase' }}>● Auto-Generated</div>
                <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14, color: '#fff', fontSize: 18, fontWeight: 700, lineHeight: 1.2, textShadow: '0 2px 12px rgba(0,0,0,.7)' }}>{title.split('—')[0]?.trim() || title}</div>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--red)' }}><Play size={22} fill="currentColor" /></div>
              </div>
              <button className="btn outline full" style={{ marginBottom: 10 }}><RefreshCw size={16} /> Regenerate Thumbnail</button>
              <div className="divider" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5, color: 'var(--muted)', marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Languages</span><b style={{ color: 'var(--text)' }}>{langs.length}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Duration</span><b style={{ color: 'var(--text)' }}>{duration}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Voice</span><b style={{ color: 'var(--text)' }}>{voice === 'clone' ? 'AI Clone' : voice[0].toUpperCase() + voice.slice(1)}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Est. credits</span><b style={{ color: 'var(--text)' }}>{langs.length * 2} / 56</b></div>
              </div>
              {msg && <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--red)', fontWeight: 600 }}>{msg}</div>}
              <button className="btn primary full lg" onClick={submit} disabled={busy}>
                <Sparkles size={18} /> {busy ? 'Queuing…' : 'Generate Short'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
