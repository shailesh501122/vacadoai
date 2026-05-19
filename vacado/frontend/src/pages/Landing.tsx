import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Play,
  Mic,
  Youtube,
  Check,
  Clapperboard,
  Bot,
  Scissors,
  FileText,
  BarChart3,
  Calendar,
  Plus,
  Twitter,
  Linkedin,
} from 'lucide-react';

const LANGS: [string, string][] = [
  ['🇪🇸', 'Spanish'], ['🇮🇳', 'Hindi'], ['🇫🇷', 'French'], ['🇸🇦', 'Arabic'],
  ['🇧🇷', 'Portuguese'], ['🇩🇪', 'German'], ['🇮🇹', 'Italian'], ['🇯🇵', 'Japanese'],
  ['🇰🇷', 'Korean'], ['🇨🇳', 'Mandarin'], ['🇹🇷', 'Turkish'], ['🇷🇺', 'Russian'],
  ['🇮🇩', 'Indonesian'], ['🇳🇱', 'Dutch'], ['🇵🇱', 'Polish'], ['🇻🇳', 'Vietnamese'],
  ['🇹🇭', 'Thai'], ['🇬🇷', 'Greek'], ['🇸🇪', 'Swedish'], ['🇺🇦', 'Ukrainian'],
  ['🇮🇱', 'Hebrew'], ['🇲🇽', 'Spanish (LatAm)'],
];

const PRICES = {
  starter: { monthly: '$29', annual: '$20' },
  pro: { monthly: '$79', annual: '$55' },
  agency: { monthly: '$199', annual: '$139' },
};

const FAQS = [
  ['How does Vacado handle copyright on movie clips?', 'Vacado generates transformative, commentary-style Shorts that fall under YouTube\'s fair-use guidelines for movie explanations. We auto-trim clip lengths, add a layered voiceover, and overlay text — the same pattern used by every major movie-explanation channel. We also run a pre-upload Content ID check and flag risky scenes before they\'re published.'],
  ['How many languages are supported, and can I add my own?', 'We ship with 50+ languages out of the box, each with multiple neural voices. Pro and Agency plans can also clone your own voice in any language with a 60-second sample.'],
  ['What\'s the actual upload limit per day?', 'YouTube allows 50 video uploads per day per channel by default. Vacado will schedule and pace your queue accordingly. There\'s no Vacado-side limit other than your plan\'s monthly Short count.'],
  ['Do I need any editing skills or software?', 'None. Enter a movie title, pick a language, click Generate. Everything from clip extraction to thumbnail to YouTube metadata is automated. If you want, you can step in to tweak the script or thumbnail before publishing.'],
  ['Is there an API for custom integrations?', 'Yes — Agency plans include full REST + webhook access. You can trigger generations, query analytics, and route uploads programmatically. API docs are in your dashboard once you upgrade.'],
  ['Can I cancel or switch plans anytime?', 'Yes. Cancel or downgrade from your dashboard — changes apply at the end of your billing cycle. Your generated Shorts and analytics history stay accessible even on the free tier.'],
];

export default function Landing() {
  const [annual, setAnnual] = useState(true);
  const p = (k: keyof typeof PRICES) => (annual ? PRICES[k].annual : PRICES[k].monthly);

  useEffect(() => {
    document.title = 'Vacado — Turn Any Movie Into a Viral YouTube Short';
  }, []);

  return (
    <div className="lp">
      <header className="nav">
        <div className="container nav-inner">
          <Link className="logo" to="/"><span className="v">V</span>acado</Link>
          <nav className="nav-links">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#how">How It Works</a>
            <Link className="btn btn-primary btn-sm" to="/dashboard">
              Dashboard <ArrowRight size={16} />
            </Link>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="badge-pill"><span className="dot" /> Now supporting 50+ languages</span>
            <h1>Turn Any Movie Into a Viral <span className="accent">YouTube Short</span> — Fully Automated</h1>
            <p className="sub">Vacado finds the clip, writes the explanation, adds voiceover in any language, and uploads it to YouTube — zero manual work.</p>
            <div className="hero-ctas">
              <Link className="btn btn-primary" to="/register">Start Free Trial <ArrowRight size={16} /></Link>
              <a className="btn btn-outline" href="#how"><Play size={16} /> Watch Demo</a>
            </div>
            <div className="hero-trust">
              <div className="avatars">
                <span style={{ background: '#ff5252' }}>M</span>
                <span style={{ background: '#5e72e4' }}>J</span>
                <span style={{ background: '#10b981' }}>A</span>
                <span style={{ background: '#f59e0b' }}>K</span>
              </div>
              <span>Trusted by 4,200+ creators automating their channels</span>
            </div>
          </div>
          <div className="mockup">
            <div className="phone">
              <div className="screen">
                <div className="thumb" />
                <div className="notch" />
                <div className="topbar">
                  <span className="lang-chip"><span className="flag" /> Español</span>
                  <span className="live-pill">Auto-Generated</span>
                </div>
                <div className="play"><Play size={26} fill="currentColor" /></div>
                <div className="actions">
                  <div><div className="ico">♥</div>284K</div>
                  <div><div className="ico">💬</div>12K</div>
                  <div><div className="ico">↗</div>9.4K</div>
                </div>
                <div className="caption">El final que NADIE entendió de Inception explicado en 60s</div>
                <div className="meta"><span>@CinemaShorts</span> · <span>2.4M views</span></div>
                <div className="progress" />
              </div>
            </div>
            <div className="card-float card-wave">
              <div className="card-title"><Mic size={16} /> AI Voiceover · Spanish</div>
              <div className="wave">
                {[30, 60, 90, 50, 75, 40, 85, 55, 70, 35, 65, 90, 45, 80, 60].map((h, i) => (
                  <span key={i} style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
            <div className="card-float card-upload">
              <div className="card-title"><Youtube size={16} /> Upload status</div>
              <div className="upload-row">
                <div className="yt"><Youtube size={18} /></div>
                <div>
                  <div className="label">@CinemaShorts</div>
                  <div className="sub">Published · 12s ago</div>
                </div>
                <div className="check"><Check size={12} /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="stats">
        <div className="container stats-row">
          {[['10,000+', 'Shorts Generated'], ['50+', 'Languages Supported'], ['98%', 'Upload Success Rate'], ['3-Click', 'Full Automation']].map(([n, l]) => (
            <div className="stat" key={l}><div><div className="num"><span>{n}</span></div><div className="lbl">{l}</div></div></div>
          ))}
        </div>
      </section>

      <section className="bd" id="how">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">How It Works</span>
            <h2>Three Steps to Viral Shorts</h2>
            <p>From movie title to published Short in under 90 seconds — no editing software, no scripting, no manual upload.</p>
            <div className="underline" />
          </div>
          <div className="steps">
            <div className="step">
              <div className="step-num">1</div>
              <div className="ic"><Clapperboard size={26} /></div>
              <h3>Enter Movie Name</h3>
              <p>Type a title or paste a YouTube/IMDB URL. Vacado pulls metadata, posters, and source clips automatically.</p>
            </div>
            <div className="step-arrow"><ArrowRight size={24} /></div>
            <div className="step">
              <div className="step-num">2</div>
              <div className="ic"><Bot size={26} /></div>
              <h3>AI Finds Clip + Writes Script</h3>
              <p>Our model detects the most shareable scene, drafts a hook-driven explanation, and times captions to the audio.</p>
            </div>
            <div className="step-arrow"><ArrowRight size={24} /></div>
            <div className="step">
              <div className="step-num">3</div>
              <div className="ic"><Youtube size={26} /></div>
              <h3>Auto Voiceover + Upload</h3>
              <p>Choose a language and voice. Vacado renders, schedules, and publishes directly to your channel.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bd" id="features" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Features</span>
            <h2>Everything You Need to Automate Your Channel</h2>
            <p>A full pipeline for movie-explainer Shorts — built for creators who run multiple channels in multiple languages.</p>
            <div className="underline" />
          </div>
          <div className="features">
            {[
              [<Scissors size={22} />, 'AI Clip Detection', 'Scene-aware models surface the most viral 60-second moments from any film — pacing, emotion, and dialogue weighted.'],
              [<Mic size={22} />, 'Multi-Language Voiceover', 'Studio-quality neural voices in 50+ languages with natural prosody, including AI clones of your own voice.'],
              [<FileText size={22} />, 'Auto Script Generation', 'Hook-first scripts tuned per language and audience. Edit any line or regenerate the whole thing in one click.'],
              [<Youtube size={22} />, 'YouTube Direct Upload', 'OAuth-connected upload with title, hashtags, thumbnails, captions, and end-screen handled for you.'],
              [<BarChart3 size={22} />, 'Channel Analytics Dashboard', 'Track views, watch-time, RPM, and per-language performance across every channel in one place.'],
              [<Calendar size={22} />, 'Bulk Scheduling', 'Queue weeks of content. Vacado spaces uploads across channels and timezones to maximize reach.'],
            ].map(([ic, t, d], i) => (
              <div className="feature" key={i}>
                <div className="ic">{ic}</div>
                <h3>{t as string}</h3>
                <p>{d as string}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lang-section">
        <div className="lang-label"><b>Available in 50+ languages</b> — voice over by native AI speakers</div>
        <div className="marquee">
          {[...LANGS, ...LANGS].map(([f, n], i) => (
            <span className="lang-pill" key={i}><span style={{ fontSize: 18, lineHeight: 1 }}>{f}</span> {n}</span>
          ))}
        </div>
      </section>

      <section className="bd" id="pricing">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Pricing</span>
            <h2>Simple, Transparent Pricing</h2>
            <p>Start free for 7 days. Cancel anytime. No setup fees, no per-upload charges.</p>
            <div className="underline" />
          </div>
          <div className="toggle-wrap">
            <span className={`label ${!annual ? 'on' : ''}`}>Monthly</span>
            <div className={`toggle ${annual ? '' : 'off'}`} onClick={() => setAnnual((a) => !a)} />
            <span className={`label ${annual ? 'on' : ''}`}>Annual <span className="save-pill">Save 30%</span></span>
          </div>
          <div className="plans">
            <div className="plan">
              <h3>Starter</h3>
              <p className="desc">For solo creators testing the waters.</p>
              <div className="price"><span className="num">{p('starter')}</span><span className="per">/mo</span></div>
              <ul>
                {['30 Shorts / month', '5 languages', '1 YouTube channel', 'Standard voices', 'Email support'].map((x) => (
                  <li key={x}><Check size={18} /> {x}</li>
                ))}
              </ul>
              <Link className="btn btn-outline" to="/register">Start Free Trial</Link>
            </div>
            <div className="plan featured">
              <span className="pop">Most Popular</span>
              <h3>Pro</h3>
              <p className="desc">For serious creators scaling channels.</p>
              <div className="price"><span className="num">{p('pro')}</span><span className="per">/mo</span></div>
              <ul>
                {['150 Shorts / month', '25 languages', '5 YouTube channels', 'Premium neural voices', 'Bulk scheduling', 'Priority support'].map((x) => (
                  <li key={x}><Check size={18} /> {x}</li>
                ))}
              </ul>
              <Link className="btn btn-primary" to="/register">Start Free Trial</Link>
            </div>
            <div className="plan">
              <h3>Agency</h3>
              <p className="desc">For teams running networks of channels.</p>
              <div className="price"><span className="num">{p('agency')}</span><span className="per">/mo</span></div>
              <ul>
                {['Unlimited Shorts', '50+ languages', '20 YouTube channels', 'White-label exports', 'Team seats & roles', 'Dedicated CSM'].map((x) => (
                  <li key={x}><Check size={18} /> {x}</li>
                ))}
              </ul>
              <Link className="btn btn-outline" to="/register">Contact Sales</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bd test-section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Testimonials</span>
            <h2>Creators Who Stopped Editing Manually</h2>
            <div className="underline" />
          </div>
          <div className="tests">
            {[
              ['Vacado replaced my entire video team. I went from 2 Shorts a week to 14 — across 4 channels — and my watch time tripled in 60 days.', '#ef4444', 'MR', 'Marco Reyes', '@MovieDecoded · 1.2M subs'],
              ['The language thing is unreal. I launched a Hindi and Portuguese version of my channel in one afternoon. Both are monetized now.', '#5e72e4', 'PS', 'Priya Sharma', '@CinemaInsight · 480K subs'],
              ['The scripts are sharp — not generic AI mush. The clip-picker actually knows which 45 seconds will hook viewers. We trust it on autopilot.', '#10b981', 'JK', 'Jonas Klein', '@FilmTwist · 720K subs'],
            ].map(([q, bg, in_, nm, ch], i) => (
              <div className="test" key={i}>
                <div className="stars">★★★★★</div>
                <p className="quote">{q}</p>
                <div className="who">
                  <div className="av" style={{ background: bg }}>{in_}</div>
                  <div><div className="nm">{nm}</div><div className="ch">{ch}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bd">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">FAQ</span>
            <h2>Frequently Asked Questions</h2>
            <div className="underline" />
          </div>
          <div className="faq">
            {FAQS.map(([q, a], i) => (
              <details className="qa" key={i} open={i === 0}>
                <summary>{q} <span className="ic"><Plus size={22} /></span></summary>
                <div className="body">{a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-banner">
        <div className="container">
          <h2>Start Automating Your Channel Today</h2>
          <p>Generate your first viral Short in under 90 seconds. Free for 7 days.</p>
          <Link className="btn btn-primary" to="/register">Get Started Free <ArrowRight size={16} /></Link>
          <small>No credit card required · Cancel anytime</small>
        </div>
      </section>

      <footer>
        <div className="container">
          <div className="ft">
            <div className="brand">
              <Link className="logo" to="/"><span className="v">V</span>acado</Link>
              <p>The end-to-end automation platform for movie-explainer creators on YouTube Shorts.</p>
              <div className="socials">
                <a href="#" aria-label="YouTube"><Youtube size={18} /></a>
                <a href="#" aria-label="X"><Twitter size={18} /></a>
                <a href="#" aria-label="LinkedIn"><Linkedin size={18} /></a>
              </div>
            </div>
            <div><h4>Product</h4><ul><li><a href="#features">Features</a></li><li><a href="#pricing">Pricing</a></li><li><Link to="/dashboard">Dashboard</Link></li><li><a href="#">Changelog</a></li><li><a href="#">Roadmap</a></li></ul></div>
            <div><h4>Resources</h4><ul><li><a href="#">Docs</a></li><li><a href="#">API Reference</a></li><li><a href="#">Tutorials</a></li><li><a href="#">Templates</a></li><li><a href="#">Status</a></li></ul></div>
            <div><h4>Company</h4><ul><li><a href="#">About</a></li><li><a href="#">Blog</a></li><li><a href="#">Careers</a></li><li><a href="#">Press kit</a></li><li><a href="#">Contact</a></li></ul></div>
            <div><h4>Legal</h4><ul><li><a href="#">Terms</a></li><li><a href="#">Privacy</a></li><li><a href="#">DMCA</a></li><li><a href="#">Acceptable Use</a></li></ul></div>
          </div>
          <div className="bottom">
            <div>© 2026 Vacado, Inc. · YouTube and the YouTube logo are trademarks of Google LLC.</div>
            <div>Made for creators · San Francisco</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
