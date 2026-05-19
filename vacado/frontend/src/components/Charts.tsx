import { useMemo } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  ArcElement, Filler, Tooltip, Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Filler, Tooltip, Legend,
);

export function ViewsLineChart({ series }: { series?: { date: string; views: number }[] }) {
  const data = useMemo(() => {
    const fallback = [42,38,55,61,48,72,69,55,78,92,84,65,88,105,98,112,134,108,142,156,138,168,182,164,196,212,188,224,248,267].map((v) => v * 1000);
    const labels = (series?.length ? series : Array.from({ length: 30 }, (_, i) => ({ date: '', views: 0 }))).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const values = series?.length && series.some((s) => s.views > 0)
      ? series.map((s) => s.views)
      : fallback;
    return { labels, values };
  }, [series]);

  return (
    <Line
      data={{
        labels: data.labels,
        datasets: [{
          data: data.values,
          borderColor: '#FF0000',
          backgroundColor: (ctx: any) => {
            const c = ctx.chart.ctx;
            const g = c.createLinearGradient(0, 0, 0, 300);
            g.addColorStop(0, 'rgba(255,0,0,0.18)');
            g.addColorStop(1, 'rgba(255,0,0,0)');
            return g;
          },
          borderWidth: 2.5, fill: true, tension: 0.35,
          pointRadius: 0, pointHoverRadius: 6,
          pointHoverBackgroundColor: '#fff', pointHoverBorderColor: '#FF0000', pointHoverBorderWidth: 2,
        }],
      }}
      options={{
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0F0F0F', padding: 12, displayColors: false,
            titleFont: { family: 'Poppins', size: 12, weight: 600 },
            bodyFont: { family: 'Poppins', size: 13 },
            callbacks: { label: (c: any) => `${c.parsed.y.toLocaleString()} views` },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#909090', font: { family: 'Poppins', size: 11 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 } },
          y: { grid: { color: '#F0F0F0' }, ticks: { color: '#909090', font: { family: 'Poppins', size: 11 }, callback: (v: any) => (v >= 1000 ? v / 1000 + 'k' : v) }, beginAtZero: true },
        },
      }}
    />
  );
}

const DONUT = [
  { lbl: 'Spanish', val: 38, color: '#FF0000' },
  { lbl: 'Hindi', val: 24, color: '#FF6B6B' },
  { lbl: 'French', val: 16, color: '#FFB4B4' },
  { lbl: 'Arabic', val: 14, color: '#0F0F0F' },
  { lbl: 'Portuguese', val: 8, color: '#909090' },
];

export function LanguageDonut({ data = DONUT, total = 624 }: { data?: typeof DONUT; total?: number }) {
  return (
    <div className="donut-wrap">
      <div className="donut-canvas">
        <Doughnut
          data={{
            labels: data.map((d) => d.lbl),
            datasets: [{ data: data.map((d) => d.val), backgroundColor: data.map((d) => d.color), borderColor: '#fff', borderWidth: 3, hoverOffset: 6 }],
          }}
          options={{
            responsive: true, maintainAspectRatio: false, cutout: '68%',
            plugins: {
              legend: { display: false },
              tooltip: { backgroundColor: '#0F0F0F', padding: 10, displayColors: false, bodyFont: { family: 'Poppins', size: 13 }, callbacks: { label: (c: any) => `${c.label}: ${c.parsed}%` } },
            },
          }}
        />
        <div className="donut-center">
          <div className="n">{total}</div>
          <div className="l">Total Shorts</div>
        </div>
      </div>
      <div className="legend">
        {data.map((d) => (
          <div className="lg-row" key={d.lbl}>
            <span className="sw" style={{ background: d.color }} />
            <span className="lb">{d.lbl}</span>
            <span className="v">{d.val}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
