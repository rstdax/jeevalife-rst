import { useEffect, useRef, useState, useMemo } from 'react';
import { Chart, registerables } from 'chart.js';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import {
  collection, query, where, orderBy, limit, getDocs,
} from 'firebase/firestore';
import { criticalIssues, lowScoreMessage, findCombinedIssue } from '../data/criticalIssues';
import { cache } from '../utils/cache';

Chart.register(...registerables);

interface CheckinData {
  mood: number;
  energy: number;
  stress: number;
  sleep: number;
  focus: number;
  jeeva_score: number;
  created_at: string;
}

// jawab index (0–3) → score/20
const SCORE_WEIGHTS = [20, 15, 10, 5];
const toScore = (answerIndex: number): number => SCORE_WEIGHTS[answerIndex] ?? 5;

// energy score label
const energyLabel = (score: number): string => {
  if (score >= 20) return 'Boosted';
  if (score >= 15) return 'Good';
  if (score >= 10) return 'Low';
  return 'Exhausted';
};

// stress score label — zyada score = achha
const stressLabel = (score: number): string => {
  if (score >= 20) return 'Relaxed';
  if (score >= 15) return 'Manageable';
  if (score >= 10) return 'Tensed';
  return 'High Stress';
};

const energyColor = (score: number): string => {
  if (score >= 20) return '#22C55E';
  if (score >= 15) return '#D4AF37';
  if (score >= 10) return '#F97316';
  return '#EF4444';
};

const stressColor = (score: number): string => {
  if (score >= 20) return '#22C55E';
  if (score >= 15) return '#60A5FA';
  if (score >= 10) return '#F97316';
  return '#EF4444';
};

const Q_KEYS = ['mood', 'energy', 'stress', 'sleep', 'focus'] as const;
const Q_LABELS = ['Mood', 'Energy', 'Stress', 'Sleep', 'Focus'];
const Q_ICONS = [
  'fa-solid fa-face-smile',
  'fa-solid fa-bolt',
  'fa-solid fa-brain',
  'fa-solid fa-moon',
  'fa-solid fa-crosshairs',
];

const InsightsView: React.FC = () => {
  const { user } = useAuth();
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const [timeRange, setTimeRange] = useState<'Today' | '7 Days' | 'This Month' | 'This Year'>('7 Days');
  const [todayCheckin, setTodayCheckin] = useState<CheckinData | null>(null);
  const [consecutiveLow, setConsecutiveLow] = useState(0);
  const [chartCheckins, setChartCheckins] = useState<CheckinData[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);

  // selected date for score card (default = today)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const selectedDateStr = selectedDate.toISOString().split('T')[0];

  const goToPrevDay = () => setSelectedDate(d => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; });
  const goToNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    if (next <= new Date()) setSelectedDate(next);
  };

  // fetch last checkin of selected date (user can do multiple per day — show last)
  useEffect(() => {
    if (!user) return;
    setDataLoading(true);

    const cacheKey = `insights_main_${user.uid}_${selectedDateStr}`;
    const cached = cache.get<{ todayCheckin: CheckinData | null; consecutiveLow: number }>(cacheKey);
    if (cached) {
      setTodayCheckin(cached.todayCheckin);
      setConsecutiveLow(cached.consecutiveLow);
      setDataLoading(false);
      if (!cache.isStale(cacheKey)) return;
    }

    const fromStr = `${selectedDateStr}T00:00:00`;
    const toStr = `${selectedDateStr}T23:59:59`;

    // Query all checkins for this user ordered by created_at desc, then filter in JS
    const qAll = query(
      collection(db, 'checkins'),
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc'),
      limit(50),
    );

    getDocs(qAll).then(snap => {
      const allDocs = snap.docs.map(d => ({ id: d.id, ...d.data() } as CheckinData & { id: string }));
      const dateData = allDocs.find(c => c.created_at >= fromStr && c.created_at <= toStr) ?? null;
      let count = 0;
      for (const c of allDocs.slice(0, 7)) {
        if (c.jeeva_score <= 25) count++;
        else break;
      }
      setTodayCheckin(dateData);
      setConsecutiveLow(count);
      setDataLoading(false);
      cache.set(cacheKey, { todayCheckin: dateData, consecutiveLow: count });
    }).catch(err => {
      console.error('checkins fetch error:', err);
      setDataLoading(false);
    });
  }, [user, selectedDateStr]);

  // chart data — cache-first
  useEffect(() => {
    if (!user) return;

    const cacheKey = `insights_chart_${user.uid}_${timeRange}`;
    const cached = cache.get<CheckinData[]>(cacheKey);

    if (cached) {
      setChartCheckins(cached);
      setChartLoading(false);
    }

    if (cached && !cache.isStale(cacheKey)) return;

    setChartLoading(true);
    const now = new Date();
    let fromStr = '';

    if (timeRange === 'Today') {
      fromStr = now.toISOString().split('T')[0] + 'T00:00:00';
    } else if (timeRange === '7 Days') {
      const d = new Date(now); d.setDate(d.getDate() - 6);
      fromStr = d.toISOString().split('T')[0] + 'T00:00:00';
    } else if (timeRange === 'This Month') {
      fromStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01T00:00:00`;
    } else {
      fromStr = `${now.getFullYear()}-01-01T00:00:00`;
    }

    // Fetch all user checkins ordered by created_at asc, filter date range in JS
    const q = query(
      collection(db, 'checkins'),
      where('user_id', '==', user.uid),
      orderBy('created_at', 'asc'),
    );

    getDocs(q).then(snap => {
      const result = snap.docs
        .map(d => d.data() as CheckinData)
        .filter(c => c.created_at >= fromStr);
      setChartCheckins(result);
      setChartLoading(false);
      cache.set(cacheKey, result);
    }).catch(err => {
      console.error('chart fetch error:', err);
      setChartLoading(false);
    });
  }, [user, timeRange]);

  // chart ke liye energy/stress average
  const chartData = useMemo(() => {
    const now = new Date();

    const avgScores = (hits: CheckinData[]) => {
      if (!hits.length) return { energy: null, stress: null };
      const energy = Math.round(hits.reduce((s, c) => s + toScore(c.energy), 0) / hits.length);
      const stress = Math.round(hits.reduce((s, c) => s + toScore(c.stress), 0) / hits.length);
      return { energy, stress };
    };

    if (timeRange === 'Today') {
      const hours = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];
      const buckets = [0, 4, 8, 12, 16, 20];
      const energy: (number | null)[] = [];
      const stress: (number | null)[] = [];
      buckets.forEach(h => {
        const hits = chartCheckins.filter(c => {
          const hr = new Date(c.created_at).getHours();
          return hr >= h && hr < h + 4;
        });
        const avg = avgScores(hits);
        energy.push(avg.energy);
        stress.push(avg.stress);
      });
      return { labels: hours, energy, stress };
    }

    if (timeRange === '7 Days') {
      const days: string[] = [];
      const energy: (number | null)[] = [];
      const stress: (number | null)[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        days.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
        const hits = chartCheckins.filter(c => c.created_at.startsWith(dateStr));
        const avg = avgScores(hits);
        energy.push(avg.energy);
        stress.push(avg.stress);
      }
      return { labels: days, energy, stress };
    }

    if (timeRange === 'This Month') {
      const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      const energy: (number | null)[] = [];
      const stress: (number | null)[] = [];
      weeks.forEach((_, wi) => {
        const hits = chartCheckins.filter(c => {
          const day = new Date(c.created_at).getDate();
          return day >= wi * 7 + 1 && day <= (wi + 1) * 7;
        });
        const avg = avgScores(hits);
        energy.push(avg.energy);
        stress.push(avg.stress);
      });
      return { labels: weeks, energy, stress };
    }

    // saal ke mahine
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const energy: (number | null)[] = [];
    const stress: (number | null)[] = [];
    months.forEach((_, mi) => {
      const hits = chartCheckins.filter(c => new Date(c.created_at).getMonth() === mi);
      const avg = avgScores(hits);
      energy.push(avg.energy);
      stress.push(avg.stress);
    });
    return { labels: months, energy, stress };
  }, [timeRange, chartCheckins]);

  useEffect(() => {
    if (!chartRef.current) return;
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;
    if (chartInstanceRef.current) chartInstanceRef.current.destroy();
    const d = chartData;
    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: d.labels,
        datasets: [
          {
            label: 'Energy',
            data: d.energy,
            borderColor: '#D4AF37',
            backgroundColor: 'rgba(212,175,55,0.08)',
            tension: 0.4,
            fill: true,
            borderWidth: 2,
            pointBackgroundColor: '#D4AF37',
            pointRadius: 5,
            pointHoverRadius: 7,
            spanGaps: true,
          },
          {
            label: 'Stress',
            data: d.stress,
            borderColor: '#EF4444',
            backgroundColor: 'transparent',
            tension: 0.4,
            borderDash: [5, 5],
            borderWidth: 2,
            pointBackgroundColor: '#EF4444',
            pointRadius: 4,
            pointHoverRadius: 6,
            spanGaps: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        color: '#fff',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(3,21,21,0.95)',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 12,
            displayColors: true,
            callbacks: {
              label: (ctx) => {
                const val = ctx.parsed.y;
                if (val === null || val === undefined) return '';
                if (ctx.dataset.label === 'Energy') {
                  return ` Energy: ${val}/20 — ${energyLabel(val)}`;
                }
                if (ctx.dataset.label === 'Stress') {
                  return ` Stress: ${val}/20 — ${stressLabel(val)}`;
                }
                return `${ctx.dataset.label}: ${val}/20`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#9CA3AF', font: { size: 10 } },
          },
          y: {
            display: true,
            min: 0,
            max: 20,
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: {
              color: '#9CA3AF',
              font: { size: 9 },
              stepSize: 5,
              callback: (val) => {
                if (val === 5) return '5 ⚠';
                if (val === 10) return '10';
                if (val === 15) return '15';
                if (val === 20) return '20 ✓';
                return '';
              },
            },
          },
        },
        interaction: { intersect: false, mode: 'index' },
      },
    });
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [chartData]);

  // score 5 wale questions
  const criticalKeys = todayCheckin
    ? Q_KEYS.filter(k => todayCheckin[k] === 3)
    : [];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--color-green)';
    if (score >= 60) return 'var(--color-gold)';
    if (score >= 40) return '#F97316';
    return '#EF4444';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    if (score > 25) return 'Low';
    return 'Critical';
  };

  // shimmer skeleton
  const Skeleton = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
    <div
      className={`rounded-xl ${className ?? ''}`}
      style={{
        background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.6s infinite',
        ...style,
      }}
    />
  );

  const InsightsSkeleton = () => (
    <main>
      {/* Score card skeleton */}
      <div className="glass-card mb-4">
        <div className="flex justify-between items-center mb-4">
          <Skeleton style={{ width: 160, height: 16 }} />
          <Skeleton style={{ width: 48, height: 14 }} />
        </div>
        <div className="flex items-end gap-3 mb-5">
          <Skeleton style={{ width: 80, height: 64 }} />
          <div className="flex flex-col gap-1 mb-1">
            <Skeleton style={{ width: 40, height: 14 }} />
            <Skeleton style={{ width: 56, height: 14 }} />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton style={{ width: 80, height: 12 }} />
              <Skeleton className="flex-1" style={{ height: 8 }} />
              <Skeleton style={{ width: 32, height: 12 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Chart card skeleton */}
      <div className="glass-card mb-4">
        <div className="flex justify-between items-center mb-4">
          <Skeleton style={{ width: 140, height: 16 }} />
          <Skeleton style={{ width: 120, height: 32, borderRadius: 12 }} />
        </div>
        <div className="flex gap-3 mb-4">
          <Skeleton className="flex-1" style={{ height: 56, borderRadius: 12 }} />
          <Skeleton className="flex-1" style={{ height: 56, borderRadius: 12 }} />
        </div>
        <Skeleton style={{ width: '100%', height: 220, borderRadius: 12 }} />
        <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-white/5">
          <Skeleton style={{ width: 60, height: 12 }} />
          <Skeleton style={{ width: 60, height: 12 }} />
        </div>
      </div>

      {/* Intelligence card skeleton */}
      <div className="glass-card mb-4 flex gap-4 items-start">
        <Skeleton style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0 }} />
        <div className="flex flex-col gap-2 flex-1">
          <Skeleton style={{ width: 140, height: 16 }} />
          <Skeleton style={{ width: '100%', height: 12 }} />
          <Skeleton style={{ width: '80%', height: 12 }} />
        </div>
      </div>
    </main>
  );

  return (
    <section id="insights-view" className="flex flex-col flex-1 pt-6 h-full overflow-y-auto"
      style={{ animation: 'fadeIn 0.4s var(--ease-smooth) forwards', paddingLeft: 'clamp(16px, 4vw, 24px)', paddingRight: 'clamp(16px, 4vw, 24px)', paddingBottom: 'calc(clamp(85px, 14vw, 100px) + env(safe-area-inset-bottom, 0px))' }}>
      <header className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Your Insights</h2>
      </header>

      {dataLoading ? <InsightsSkeleton /> : <main>

        {/* ── JEEVA SCORE SECTION ── */}
        {todayCheckin ? (
          <div className="glass-card mb-4">
            {/* Score Header with date navigation */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold">
                {isToday ? "Today's Jeeva Score" : "Jeeva Score"}
              </h3>
              <div className="flex items-center gap-2">
                <button onClick={goToPrevDay}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                  style={{ color: 'var(--color-muted)' }}>
                  <i className="fa-solid fa-chevron-left text-xs" />
                </button>
                <button onClick={() => setSelectedDate(new Date())}
                  className="text-xs font-semibold px-2 py-1 rounded-lg transition-colors"
                  style={{
                    color: isToday ? 'var(--color-teal-light)' : 'var(--color-gold)',
                    background: isToday ? 'rgba(0,242,254,0.08)' : 'rgba(212,175,55,0.08)',
                  }}>
                  {isToday ? 'Today' : selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: selectedDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined })}
                </button>
                <button onClick={goToNextDay}
                  disabled={isToday}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30"
                  style={{ color: 'var(--color-muted)' }}>
                  <i className="fa-solid fa-chevron-right text-xs" />
                </button>
              </div>
            </div>

            {/* Big Score */}
            <div className="flex items-end gap-3 mb-5">
              <span className="font-extrabold leading-none" style={{ fontFamily: 'var(--font-heading)', color: getScoreColor(todayCheckin.jeeva_score), fontSize: 'clamp(2.5rem, 12vw, 3.75rem)' }}>
                {todayCheckin.jeeva_score}
              </span>
              <div className="mb-1">
                <span className="text-lg text-muted">/100</span>
                <p className="text-sm font-semibold" style={{ color: getScoreColor(todayCheckin.jeeva_score) }}>
                  {getScoreLabel(todayCheckin.jeeva_score)}
                </p>
              </div>
            </div>

            {/* Score breakdown bars */}
            <div className="flex flex-col gap-3">
              {Q_KEYS.map((key, i) => {
                const answerIndex = todayCheckin[key] ?? 0;
                const score = toScore(answerIndex);
                const isCritical = answerIndex === 3;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <div className="flex items-center gap-2 shrink-0" style={{ width: 'clamp(65px, 18vw, 80px)' }}>
                      <i className={`${Q_ICONS[i]} text-xs`} style={{ color: isCritical ? '#EF4444' : 'var(--color-muted)' }} />
                      <span className="text-xs" style={{ color: isCritical ? '#EF4444' : 'var(--color-muted)' }}>{Q_LABELS[i]}</span>
                    </div>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${(score / 20) * 100}%`,
                          background: isCritical ? '#EF4444' : score >= 15 ? 'var(--color-green)' : score >= 10 ? 'var(--color-gold)' : '#F97316',
                        }} />
                    </div>
                    <span className="text-xs font-bold w-8 text-right" style={{ color: isCritical ? '#EF4444' : 'var(--color-muted)' }}>
                      {score}/20
                    </span>
                    {isCritical && <i className="fa-solid fa-triangle-exclamation text-xs" style={{ color: '#EF4444' }} />}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="glass-card mb-4 text-center py-8">
            <i className="fa-solid fa-chart-simple text-3xl mb-3 block" style={{ color: 'var(--color-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              {isToday ? 'No check-in today yet' : `No check-in on ${selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
              {isToday ? 'Complete your 60s check-in to see your Jeeva Score' : 'Use ‹ › to navigate to another day'}
            </p>
          </div>
        )}

        {/* ── CRITICAL ISSUES ── */}

        {/* 5-critical: Total Collapse (score = 25) */}
        {criticalKeys.length === 5 && (
          <div className="glass-card mb-4"
            style={{ background: 'rgba(139,0,0,0.15)', borderColor: '#7f0000', borderWidth: 2 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(139,0,0,0.3)', animation: 'pulseGlow 1.5s linear infinite' }}>
                <i className="fa-solid fa-skull text-xl" style={{ color: '#ff4444' }} />
              </div>
              <div>
                <h4 className="text-base font-bold" style={{ color: '#ff4444' }}>⚠️ JEEVA TOTAL COLLAPSE</h4>
                <p className="text-[10px] uppercase tracking-widest" style={{ color: '#ff4444', opacity: 0.8 }}>
                  All 5 vitals critical — Score: 25/100
                </p>
              </div>
            </div>

            {/* Issue */}
            <div className="p-3 rounded-xl mb-4" style={{ background: 'rgba(139,0,0,0.1)', border: '1px solid rgba(139,0,0,0.3)' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>The Issue</p>
              <p className="text-sm leading-relaxed" style={{ color: '#D1D5DB' }}>
                You are in a total exhaustion state. This is not just 'stress' — this is a complete depletion of your mental, physical, and emotional reserves. Every single pillar of your wellbeing has collapsed simultaneously.
              </p>
            </div>

            {/* Jeeva Intelligence */}
            <div className="p-3 rounded-xl mb-4" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-gold)' }}>
                <i className="fa-solid fa-brain mr-1" /> Jeeva Intelligence
              </p>
              <p className="text-sm leading-relaxed italic" style={{ color: '#D1D5DB' }}>
                "This is not the time to push — it's the time to protect. Your system has triggered an emergency survival mode. Any effort right now will cost more than it gives."
              </p>
            </div>

            {/* Action Plan */}
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>Survival Action Plan</p>
            <div className="flex flex-col gap-3">
              {[
                { text: 'The Rule of 1 — 3 litres of water, 3 small nutritious meals, and 3 hours of daylight exposure (even through a window) today.' },
                { text: 'Medical Check — If this state persists for more than 48 hours, consult a doctor or mental health professional immediately.' },
                { text: 'Total Surrender — Do not attempt a single task on your JeevaLife dashboard. Your only goal is to survive the day and reach sleep.' },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-xs font-bold shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
                    style={{ background: 'rgba(139,0,0,0.25)', color: '#ff4444' }}>{i + 1}</span>
                  <p className="text-sm leading-relaxed" style={{ color: '#D1D5DB' }}>{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4-critical: Red Alert */}
        {criticalKeys.length === 4 && (
          <div className="glass-card mb-4"
            style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.5)', borderWidth: 2 }}>
            {/* Pulsing alert header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(239,68,68,0.25)', animation: 'pulseGlow 2s linear infinite' }}>
                <i className="fa-solid fa-circle-exclamation text-xl" style={{ color: '#EF4444' }} />
              </div>
              <div>
                <h4 className="text-base font-bold" style={{ color: '#EF4444' }}>🚨 RED ALERT — Near-Total Shutdown</h4>
                <p className="text-[10px] uppercase tracking-widest" style={{ color: '#EF4444', opacity: 0.8 }}>
                  {criticalKeys.length} of 5 vitals in danger zone
                </p>
              </div>
            </div>

            {/* Issue */}
            <div className="p-3 rounded-xl mb-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>The Issue</p>
              <p className="text-sm leading-relaxed" style={{ color: '#D1D5DB' }}>
                80% of your primary vitals are in the danger zone. Your body and mind are in a near-total shutdown state. Continuing to push will result in long-term health consequences.
              </p>
            </div>

            {/* Jeeva Intelligence */}
            <div className="p-3 rounded-xl mb-4" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-gold)' }}>
                <i className="fa-solid fa-brain mr-1" /> Jeeva Intelligence
              </p>
              <p className="text-sm leading-relaxed italic" style={{ color: '#D1D5DB' }}>
                "CRITICAL ALERT: 80% of your primary vitals are in the danger zone. Your body is screaming for a full stop. Continuing to push will result in long-term health consequences."
              </p>
            </div>

            {/* Action Plan */}
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>Immediate Action Plan</p>
            <div className="flex flex-col gap-3">
              {[
                { icon: 'fa-solid fa-hand', text: 'Immediate Cessation — Stop whatever you are doing right now. No exceptions.' },
                { icon: 'fa-solid fa-car', text: 'Safety First — If you are driving or operating machinery, stop and rest immediately.' },
                { icon: 'fa-solid fa-people-group', text: 'Human Support — Inform a family member or friend that you are feeling extremely unwell and need 12–24 hours of undisturbed rest.' },
                { icon: 'fa-solid fa-mobile-screen-button', text: 'Zero Stimulation — Turn off your phone. Total digital silence is recommended.' },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-xs font-bold shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
                    style={{ background: 'rgba(239,68,68,0.2)', color: '#EF4444' }}>{i + 1}</span>
                  <p className="text-sm leading-relaxed" style={{ color: '#D1D5DB' }}>{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {criticalKeys.length === 1 && (() => {
          // Single critical — 3 separate cards
          const issue = criticalIssues[criticalKeys[0]];
          return (
            <div className="flex flex-col gap-3 mb-4">
              {/* Card 1 — Critical (red) */}
              <div className="glass-card"
                style={{ background: 'rgba(239,68,68,0.07)', borderColor: 'rgba(239,68,68,0.35)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(239,68,68,0.18)' }}>
                    <i className="fa-solid fa-triangle-exclamation text-base" style={{ color: '#EF4444' }} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold" style={{ color: '#EF4444' }}>Critical: {issue.question}</h4>
                    <p className="text-[10px] uppercase tracking-widest" style={{ color: '#EF4444', opacity: 0.7 }}>Score: 5/20</p>
                  </div>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>The Issue</p>
                <p className="text-sm leading-relaxed" style={{ color: '#D1D5DB' }}>{issue.issue}</p>
              </div>

              {/* Card 2 — Jeeva Intelligence (gold) */}
              <div className="glass-card"
                style={{ background: 'rgba(212,175,55,0.07)', borderColor: 'rgba(212,175,55,0.35)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(212,175,55,0.15)' }}>
                    <i className="fa-solid fa-brain text-base" style={{ color: 'var(--color-gold)' }} />
                  </div>
                  <p className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--color-gold)' }}>
                    Jeeva Intelligence
                  </p>
                </div>
                <p className="text-sm leading-relaxed italic" style={{ color: '#D1D5DB' }}>"{issue.advice}"</p>
              </div>

              {/* Card 3 — Action Plan (green) */}
              <div className="glass-card"
                style={{ background: 'rgba(34,197,94,0.06)', borderColor: 'rgba(34,197,94,0.3)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(34,197,94,0.15)' }}>
                    <i className="fa-solid fa-list-check text-base" style={{ color: '#22C55E' }} />
                  </div>
                  <p className="text-sm font-bold uppercase tracking-widest" style={{ color: '#22C55E' }}>Action Plan</p>
                </div>
                <div className="flex flex-col gap-3">
                  {issue.actionPlan.map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-xs font-bold shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
                        style={{ background: 'rgba(34,197,94,0.18)', color: '#22C55E' }}>{i + 1}</span>
                      <p className="text-sm leading-relaxed" style={{ color: '#D1D5DB' }}>{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {criticalKeys.length >= 2 && criticalKeys.length < 4 && (() => {
          // Check if there's a specific combined issue for this exact pair
          const combined = findCombinedIssue(criticalKeys);
          const iconMap: Record<string, string> = {
            mood: 'fa-solid fa-face-smile',
            energy: 'fa-solid fa-bolt',
            stress: 'fa-solid fa-brain',
            sleep: 'fa-solid fa-moon',
            focus: 'fa-solid fa-crosshairs',
          };

          if (combined) {
            // Known combination — show unified 3 cards with combined content
            return (
              <div className="flex flex-col gap-3 mb-4">
                {/* Card 1 — Combined Critical (red) */}
                <div className="glass-card"
                  style={{ background: 'rgba(239,68,68,0.07)', borderColor: 'rgba(239,68,68,0.35)' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(239,68,68,0.18)' }}>
                      <i className="fa-solid fa-triangle-exclamation text-base" style={{ color: '#EF4444' }} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold" style={{ color: '#EF4444' }}>{combined.title}</h4>
                      <p className="text-[10px] uppercase tracking-widest" style={{ color: '#EF4444', opacity: 0.7 }}>
                        {criticalKeys.map(k => criticalIssues[k]?.question).join(' + ')} — Score: 5/20 each
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>The Issue</p>
                  <p className="text-sm leading-relaxed" style={{ color: '#D1D5DB' }}>{combined.issue}</p>
                </div>

                {/* Card 2 — Jeeva Intelligence (gold) */}
                <div className="glass-card"
                  style={{ background: 'rgba(212,175,55,0.07)', borderColor: 'rgba(212,175,55,0.35)' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(212,175,55,0.15)' }}>
                      <i className="fa-solid fa-brain text-base" style={{ color: 'var(--color-gold)' }} />
                    </div>
                    <p className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--color-gold)' }}>
                      Jeeva Intelligence
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed italic" style={{ color: '#D1D5DB' }}>"{combined.advice}"</p>
                </div>

                {/* Card 3 — Action Plan (green) */}
                <div className="glass-card"
                  style={{ background: 'rgba(34,197,94,0.06)', borderColor: 'rgba(34,197,94,0.3)' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(34,197,94,0.15)' }}>
                      <i className="fa-solid fa-list-check text-base" style={{ color: '#22C55E' }} />
                    </div>
                    <p className="text-sm font-bold uppercase tracking-widest" style={{ color: '#22C55E' }}>Action Plan</p>
                  </div>
                  <div className="flex flex-col gap-3">
                    {combined.actionPlan.map((step, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-xs font-bold shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
                          style={{ background: 'rgba(34,197,94,0.18)', color: '#22C55E' }}>{i + 1}</span>
                        <p className="text-sm leading-relaxed" style={{ color: '#D1D5DB' }}>{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          }

          // Unknown combination (3+ criticals or unlisted pair) — merged individual cards
          const issues = criticalKeys.map(k => ({ key: k, ...criticalIssues[k] }));
          return (
            <div className="flex flex-col gap-3 mb-4">
              {/* Card 1 — All Criticals (red) */}
              <div className="glass-card"
                style={{ background: 'rgba(239,68,68,0.07)', borderColor: 'rgba(239,68,68,0.35)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(239,68,68,0.18)' }}>
                    <i className="fa-solid fa-triangle-exclamation text-base" style={{ color: '#EF4444' }} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold" style={{ color: '#EF4444' }}>Critical</h4>
                    <p className="text-[10px] uppercase tracking-widest" style={{ color: '#EF4444', opacity: 0.7 }}>{issues.length} areas need attention</p>
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  {issues.map((issue, idx) => (
                    <div key={issue.key}>
                      {idx > 0 && <div className="h-px mb-4" style={{ background: 'rgba(239,68,68,0.15)' }} />}
                      <div className="flex items-center gap-2 mb-1.5">
                        <i className={`${iconMap[issue.key]} text-xs`} style={{ color: '#EF4444' }} />
                        <span className="text-sm font-bold" style={{ color: '#EF4444' }}>{issue.question}</span>
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>The Issue</p>
                      <p className="text-sm leading-relaxed" style={{ color: '#D1D5DB' }}>{issue.issue}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 2 — Jeeva Intelligence (gold) */}
              <div className="glass-card"
                style={{ background: 'rgba(212,175,55,0.07)', borderColor: 'rgba(212,175,55,0.35)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(212,175,55,0.15)' }}>
                    <i className="fa-solid fa-brain text-base" style={{ color: 'var(--color-gold)' }} />
                  </div>
                  <p className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--color-gold)' }}>Jeeva Intelligence</p>
                </div>
                <div className="flex flex-col gap-4">
                  {issues.map((issue, idx) => (
                    <div key={issue.key}>
                      {idx > 0 && <div className="h-px mb-4" style={{ background: 'rgba(212,175,55,0.12)' }} />}
                      <div className="flex items-center gap-2 mb-1.5">
                        <i className={`${iconMap[issue.key]} text-xs`} style={{ color: 'var(--color-gold)' }} />
                        <span className="text-sm font-semibold" style={{ color: 'var(--color-gold)' }}>{issue.question}</span>
                      </div>
                      <p className="text-sm leading-relaxed italic" style={{ color: '#D1D5DB' }}>"{issue.advice}"</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 3 — Action Plan (green) */}
              <div className="glass-card"
                style={{ background: 'rgba(34,197,94,0.06)', borderColor: 'rgba(34,197,94,0.3)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(34,197,94,0.15)' }}>
                    <i className="fa-solid fa-list-check text-base" style={{ color: '#22C55E' }} />
                  </div>
                  <p className="text-sm font-bold uppercase tracking-widest" style={{ color: '#22C55E' }}>Action Plan</p>
                </div>
                <div className="flex flex-col gap-5">
                  {issues.map((issue, idx) => (
                    <div key={issue.key}>
                      {idx > 0 && <div className="h-px mb-5" style={{ background: 'rgba(34,197,94,0.12)' }} />}
                      <div className="flex items-center gap-2 mb-3">
                        <i className={`${iconMap[issue.key]} text-xs`} style={{ color: '#22C55E' }} />
                        <span className="text-sm font-semibold" style={{ color: '#22C55E' }}>{issue.question}</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        {issue.actionPlan.map((step, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <span className="text-xs font-bold shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
                              style={{ background: 'rgba(34,197,94,0.18)', color: '#22C55E' }}>{i + 1}</span>
                            <p className="text-sm leading-relaxed" style={{ color: '#D1D5DB' }}>{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── LOW SCORE WARNING ── */}
        {todayCheckin && todayCheckin.jeeva_score <= 25 && (
          <div className="glass-card mb-4"
            style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.3)' }}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(239,68,68,0.15)' }}>
                <i className="fa-solid fa-heart-pulse text-lg" style={{ color: '#EF4444' }} />
              </div>
              <div>
                <h4 className="text-sm font-bold mb-1" style={{ color: '#EF4444' }}>{lowScoreMessage.title}</h4>
                <p className="text-sm leading-relaxed" style={{ color: '#D1D5DB' }}>{lowScoreMessage.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── 3-DAY CRITICAL ALERT ── */}
        {consecutiveLow >= 3 && (
          <div className="glass-card mb-4"
            style={{ background: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.4)' }}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(239,68,68,0.2)' }}>
                <i className="fa-solid fa-bell text-lg" style={{ color: '#EF4444' }} />
              </div>
              <div>
                <h4 className="text-sm font-bold mb-1" style={{ color: '#EF4444' }}>Serious Concern — 3 Days</h4>
                <p className="text-sm leading-relaxed mb-3" style={{ color: '#D1D5DB' }}>
                  Your wellness score has been critically low for {consecutiveLow} consecutive days. Your emergency contact has been notified.
                  Please reach out to a mental health professional immediately.
                </p>
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-muted)' }}>
                  <i className="fa-brands fa-whatsapp" style={{ color: '#25D366' }} />
                  <span>WhatsApp alert sent to your emergency contact</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ACTION CHIPS ── */}
        <div className="glass-card mb-4">
          <h3 className="text-base font-semibold">Actionable Recommendations</h3>
          <div className="flex flex-wrap gap-2.5 mt-3">
            {[
              { icon: 'fa-solid fa-glass-water', label: 'Drink More Water' },
              { icon: 'fa-solid fa-om', label: '5m Meditation' },
              { icon: 'fa-solid fa-person-praying', label: 'Evening Yoga' },
            ].map(chip => (
              <div key={chip.label} className="glass-panel flex items-center gap-2 px-4 py-2.5 rounded-full text-sm"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <i className={chip.icon} style={{ color: 'var(--color-gold)' }} />
                {chip.label}
              </div>
            ))}
          </div>
        </div>

        {/* ── SLEEP COMPARISON ── */}
        <div className="glass-card mb-4">
          <h3 className="text-base font-semibold">Sleep vs Global Average</h3>
          <div className="flex flex-col gap-3 mt-4">
            {[
              { label: 'You (6.5h)', width: '65%', cls: 'bg-[var(--color-gold)]' },
              { label: 'Global (7.5h)', width: '75%', cls: 'bg-white/40' },
              { label: 'Optimum (8h)', width: '80%', cls: 'bg-[var(--color-green)]' },
            ].map(bar => (
              <div key={bar.label} className="flex items-center gap-3 text-sm">
                <span className="w-[90px] shrink-0" style={{ color: 'var(--color-muted)' }}>{bar.label}</span>
                <div className="glass-panel flex-1 h-3 rounded-md overflow-hidden relative" style={{ background: 'rgba(0,0,0,0.3)' }}>
                  <div className={`absolute left-0 top-0 h-full rounded-md ${bar.cls}`}
                    style={{ width: bar.width, transition: 'width 1s ease-out' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CHART ── */}
        <div className="glass-card mb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-semibold">Energy vs. Stress</h3>
            <div className="flex gap-1 p-1 rounded-xl bg-black/20 border border-white/5">
              {(['Today', '7 Days', 'This Month', 'This Year'] as const).map(range => (
                <button key={range} onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all duration-300 ${timeRange === range ? 'bg-[var(--color-gold)] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]' : 'text-muted hover:text-white hover:bg-white/5'}`}>
                  {range === '7 Days' ? '7D' : range.replace('This ', '')}
                </button>
              ))}
            </div>
          </div>

          {/* Today's Energy & Stress status pills */}
          {todayCheckin && (
            <div className="flex gap-3 mb-4">
              {/* Energy */}
              {(() => {
                const score = toScore(todayCheckin.energy);
                const label = energyLabel(score);
                const color = energyColor(score);
                return (
                  <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: `${color}14`, border: `1px solid ${color}33` }}>
                    <i className="fa-solid fa-bolt text-sm" style={{ color }} />
                    <div>
                      <p className="text-[10px] text-muted uppercase tracking-wider">Energy</p>
                      <p className="text-sm font-bold" style={{ color }}>{score}/20 — {label}</p>
                    </div>
                  </div>
                );
              })()}
              {/* Stress */}
              {(() => {
                const score = toScore(todayCheckin.stress);
                const label = stressLabel(score);
                const color = stressColor(score);
                return (
                  <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: `${color}14`, border: `1px solid ${color}33` }}>
                    <i className="fa-solid fa-brain text-sm" style={{ color }} />
                    <div>
                      <p className="text-[10px] text-muted uppercase tracking-wider">Stress</p>
                      <p className="text-sm font-bold" style={{ color }}>{score}/20 — {label}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Score scale hint */}
          <div className="flex items-center gap-2 mb-4 px-1">
            <span className="text-[10px] text-muted">Scale: 5 = worst</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <span className="text-[10px] text-muted">20 = best</span>
          </div>

          <div className="chart-wrapper w-full relative" style={{ height: 220 }}>
            {chartLoading && (
              <div className="absolute inset-0 z-10 rounded-xl"
                style={{
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.6s infinite',
                }} />
            )}
            <canvas id="insightsChart" ref={chartRef} />
          </div>
          <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--color-gold)]" />
              <span className="text-[10px] text-muted uppercase tracking-wider">Energy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#EF4444]" />
              <span className="text-[10px] text-muted uppercase tracking-wider">Stress</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted">Higher = Better for both</span>
            </div>
          </div>
        </div>

        {/* ── JEEVA INTELLIGENCE ── */}
        <div className="glass-card mb-4 flex gap-4 items-start"
          style={{ background: 'rgba(212,175,55,0.05)', borderColor: 'rgba(212,175,55,0.2)' }}>
          <div className="text-2xl p-2.5 rounded-xl shrink-0" style={{ color: 'var(--color-gold)', background: 'rgba(212,175,55,0.1)' }}>
            <i className="fa-solid fa-wand-magic-sparkles" />
          </div>
          <div>
            <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--color-gold)' }}>Jeeva Intelligence</h3>
            <p className="text-sm leading-relaxed" style={{ color: '#D1D5DB' }}>
              {todayCheckin
                ? todayCheckin.jeeva_score >= 70
                  ? `You're performing well today. Keep maintaining your current routine to sustain this score.`
                  : `Your score today is ${todayCheckin.jeeva_score}/100. Focus on the critical areas above to improve your wellness.`
                : `Complete your daily check-in to receive personalized Jeeva Intelligence insights.`}
            </p>
          </div>
        </div>

      </main>}
    </section>
  );
};

export default InsightsView;
