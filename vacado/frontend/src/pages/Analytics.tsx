import { useEffect, useState } from 'react';
import { Eye, Coins, Video, TrendingUp } from 'lucide-react';
import KPICard from '../components/KPICard';
import { ViewsLineChart, LanguageDonut } from '../components/Charts';
import { analyticsApi } from '../api/endpoints';

export default function Analytics() {
  const [ov, setOv] = useState<any>(null);
  const [series, setSeries] = useState<any[]>([]);
  const [langs, setLangs] = useState<any[]>([]);

  useEffect(() => {
    analyticsApi.overview().then(setOv).catch(() => undefined);
    analyticsApi.performance().then((d) => setSeries(d.series)).catch(() => undefined);
    analyticsApi.languages().then((d) => setLangs(d.languages)).catch(() => undefined);
  }, []);

  const fmt = (n?: number) =>
    n == null ? '—' : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${n}`;

  const palette = ['#FF0000', '#FF6B6B', '#FFB4B4', '#0F0F0F', '#909090'];
  const donut = langs.length
    ? langs.slice(0, 5).map((l, i) => ({ lbl: l.language, val: l.pct, color: palette[i] }))
    : undefined;

  return (
    <>
      <div className="row r4">
        <KPICard icon={<Video size={20} />} num={ov ? `${ov.totalShorts}` : '1,284'} label="Total Shorts" trend={{ dir: 'up', text: '12%' }} />
        <KPICard icon={<Eye size={20} />} num={ov ? fmt(ov.totalViews) : '2.4M'} label="Total Views" trend={{ dir: 'up', text: '34%' }} />
        <KPICard icon={<TrendingUp size={20} />} num="64%" label="Avg. Retention" trend={{ dir: 'up', text: '5%' }} />
        <KPICard icon={<Coins size={20} />} num={ov ? `$${(ov.estRevenue ?? 0).toLocaleString()}` : '$3,840'} label="Est. Revenue (30d)" trend={{ dir: 'up', text: '18%' }} />
      </div>

      <div className="row r2">
        <div className="card">
          <div className="card-head"><div><h3>Views Over Time</h3><div className="sub">Last 30 days, all channels</div></div></div>
          <div className="chart-wrap"><ViewsLineChart series={series} /></div>
        </div>
        <div className="card">
          <div className="card-head"><div><h3>Top Languages</h3><div className="sub">Share of total Shorts</div></div></div>
          <LanguageDonut data={donut} total={ov?.totalShorts ?? 624} />
        </div>
      </div>

      <div className="card">
        <div className="card-head"><div><h3>Top Movies</h3><div className="sub">Best performing source titles</div></div></div>
        <table className="tbl">
          <thead><tr><th style={{ paddingLeft: 22 }}>Movie</th><th>Shorts</th><th>Views</th><th>Avg. Retention</th></tr></thead>
          <tbody>
            {[
              ['Inception (2010)', 18, '1.2M', '71%'],
              ['Interstellar (2014)', 14, '980K', '68%'],
              ['Parasite (2019)', 11, '740K', '65%'],
              ['Oppenheimer (2023)', 9, '610K', '63%'],
              ['Joker (2019)', 7, '420K', '59%'],
            ].map(([m, s, v, r]) => (
              <tr key={m as string}>
                <td style={{ paddingLeft: 22, fontWeight: 500 }}>{m}</td>
                <td>{s}</td>
                <td><b>{v}</b></td>
                <td><span className="pill green">{r}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
