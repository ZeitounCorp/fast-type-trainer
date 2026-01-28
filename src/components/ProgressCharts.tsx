import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart,
} from 'recharts';
import type { Session } from '../types';
import { format } from 'date-fns';

type Props = {
  sessions: Session[];
};

const ProgressCharts = ({ sessions }: Props) => {
  const sorted = [...sessions].sort((a, b) => a.date - b.date).slice(-12);
  const data = sorted.map((s) => ({
    date: format(s.date, 'MMM d'),
    wpm: s.wpm,
    accuracy: s.accuracy,
  }));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="card rounded-2xl p-4">
        <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-100">WPM Trend</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8' }} />
              <YAxis tick={{ fill: '#94a3b8' }} />
              <Tooltip />
              <Line type="monotone" dataKey="wpm" stroke="#3b82f6" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card rounded-2xl p-4">
        <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-100">Accuracy</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="acc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8' }} />
              <YAxis tick={{ fill: '#94a3b8' }} domain={[0, 100]} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="accuracy"
                stroke="#10b981"
                strokeWidth={3}
                fill="url(#acc)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ProgressCharts;
