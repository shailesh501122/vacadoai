import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Video, Youtube, Eye, Coins, ChevronLeft, ChevronRight, Filter, Download, MoreHorizontal,
} from 'lucide-react';
import KPICard from '../components/KPICard';
import { ViewsLineChart, LanguageDonut } from '../components/Charts';
import ShortsTable from '../components/ShortsTable';
import { analyticsApi, shortsApi } from '../api/endpoints';

export default function DashboardHome() {
  const nav = useNavigate();
  const [ov, setOv] = useState<any>(null);
  const [series, setSeries] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [range, setRange] = useState('30D');

  useEffect(() => {
    analyticsApi.overview().then(setOv).catch(() => undefined);
    analyticsApi.performance().then((d) => setSeries(d.series)).catch(() => undefined);
    shortsApi.list({ limit: 6 }).then((d) => { setRows(d.items); setTotal(d.total); }).catch(() => undefined);
  }, []);

  const fmt = (n?: number) =>
    n == null ? '—' : n >= 1_000_000 ? `${(n / 1e6).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${n}`;

  return (
    <>
      <div className="row r4">
        <KPICard icon={<Video size={20} />} num={ov ? `${ov.totalShorts}` : '1,284'} label="Total Shorts Generated" trend={{ dir: 'up', text: '12% this month' }} />

        <KPICard icon={<Eye size={20} />} num={ov ? fmt(ov.totalViews) : '2.4M'} label="Total Views This Month" trend={{ dir: 'up', text: '34%' }} />
        <KPICard icon={<Coins size={20} />} num={ov ? `$${ov.estRevenue.toLocaleString()}` : '$3,840'} label="Estimated Revenue" trend={{ dir: 'up', text: '18%' }} />
      </div>

      <div className="row r2">
        <div className="card">
          <div className="card-head">
            <div>
              <h3>Shorts Performance</h3>
              <div className="sub">Views over the last 30 days</div>
            </div>
            <div className="toggle-pills">
              {['30D', '7D', '90D'].map((r) => (
                <button key={r} className={range === r ? 'on' : ''} onClick={() => setRange(r)}>{r}</button>
              ))}
            </div>
          </div>
          <div className="chart-wrap"><ViewsLineChart series={series} /></div>
        </div>
        <div className="card">
          <div className="card-head">
            <div>
              <h3>Top Languages</h3>
              <div className="sub">By Shorts published this month</div>
            </div>
            <button className="act-btn"><MoreHorizontal size={18} /></button>
          </div>
          <LanguageDonut />
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h3>Recent Shorts</h3>
            <div className="sub">All generated content</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn outline sm"><Filter size={15} /> Filter</button>
            <button className="btn outline sm"><Download size={15} /> Export</button>
          </div>
        </div>
        <ShortsTable rows={rows} onView={() => nav('/dashboard/shorts')} />
        <div className="pagination">
          <div>Showing <b style={{ color: 'var(--text)' }}>1–{Math.min(6, rows.length || 6)}</b> of <b style={{ color: 'var(--text)' }}>{(total || 1284).toLocaleString()}</b> Shorts</div>
          <div className="pg-btns">
            <button className="pg-btn" disabled><ChevronLeft size={14} /></button>
            <button className="pg-btn active">1</button>
            <button className="pg-btn">2</button>
            <button className="pg-btn">3</button>
            <button className="pg-btn">…</button>
            <button className="pg-btn">{Math.max(1, Math.ceil((total || 1284) / 6))}</button>
            <button className="pg-btn"><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>
    </>
  );
}
