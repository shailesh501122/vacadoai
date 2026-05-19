import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function KPICard({
  icon, num, label, trend,
}: {
  icon: ReactNode;
  num: string;
  label: string;
  trend?: { dir: 'up' | 'down' | 'flat'; text: string };
}) {
  const TrendIcon = trend?.dir === 'up' ? TrendingUp : trend?.dir === 'down' ? TrendingDown : Minus;
  return (
    <div className="kpi">
      <div className="top">
        <div className="ic">{icon}</div>
        {trend && (
          <span className={`pill ${trend.dir}`}>
            <TrendIcon size={13} /> {trend.text}
          </span>
        )}
      </div>
      <div>
        <div className="num">{num}</div>
        <div className="lbl">{label}</div>
      </div>
    </div>
  );
}
