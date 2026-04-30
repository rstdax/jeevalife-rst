import { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const InsightsView: React.FC = () => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const [timeRange, setTimeRange] = useState<'Today' | '7 Days' | 'This Month' | 'This Year'>('7 Days');

  const chartData = {
    'Today': {
      labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
      energy: [30, 20, 50, 70, 85, 60],
      stress: [20, 15, 40, 55, 30, 25]
    },
    '7 Days': {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      energy: [40, 60, 50, 80, 75, 90, 85],
      stress: [70, 50, 60, 30, 40, 20, 25]
    },
    'This Month': {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      energy: [65, 72, 68, 80],
      stress: [45, 38, 42, 30]
    },
    'This Year': {
      labels: ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'],
      energy: [55, 60, 75, 85, 70, 90],
      stress: [50, 45, 35, 25, 40, 20]
    }
  };

  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        // Destroy previous chart if it exists
        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy();
        }

        const currentData = chartData[timeRange];

        chartInstanceRef.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: currentData.labels,
            datasets: [
              {
                label: 'Energy',
                data: currentData.energy,
                borderColor: '#D4AF37',
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 2,
                pointBackgroundColor: '#D4AF37',
                pointRadius: 4,
                pointHoverRadius: 6,
              },
              {
                label: 'Stress',
                data: currentData.stress,
                borderColor: '#EF4444',
                backgroundColor: 'transparent',
                tension: 0.4,
                borderDash: [5, 5],
                borderWidth: 2,
                pointRadius: 0,
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
                backgroundColor: 'rgba(3, 21, 21, 0.9)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                titleFont: { family: 'Inter', size: 12 },
                bodyFont: { family: 'Inter', size: 12 },
                padding: 10,
                displayColors: false,
              }
            },
            scales: {
              x: {
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: { color: '#9CA3AF', font: { size: 10 } }
              },
              y: {
                display: false,
                min: 0,
                max: 100
              },
            },
            interaction: {
              intersect: false,
              mode: 'index',
            },
          },
        });
      }
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [timeRange]);

  return (
    <section
      id="insights-view"
      className="flex flex-col flex-1 px-6 pt-6 pb-[100px] h-full overflow-y-auto"
      style={{ animation: 'fadeIn 0.4s var(--ease-smooth) forwards' }}
    >
      <header className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Your Insights</h2>
      </header>

      <main>
        {/* Action Chips */}
        <div className="glass-card mb-4">
          <h3 className="text-base font-semibold">Actionable Recommendations</h3>
          <div className="flex flex-wrap gap-2.5 mt-3">
            {[
              { icon: 'fa-solid fa-glass-water', label: 'Drink More Water' },
              { icon: 'fa-solid fa-om', label: '5m Meditation' },
              { icon: 'fa-solid fa-person-praying', label: 'Evening Yoga' },
            ].map((chip) => (
              <div
                key={chip.label}
                className="glass-panel flex items-center gap-2 px-4 py-2.5 rounded-full text-sm"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <i className={chip.icon} style={{ color: 'var(--color-gold)' }} />
                {chip.label}
              </div>
            ))}
          </div>
        </div>

        {/* Sleep Comparison */}
        <div className="glass-card mb-4">
          <h3 className="text-base font-semibold">Sleep vs Global Average</h3>
          <div className="flex flex-col gap-3 mt-4">
            {[
              { label: 'You (6.5h)', width: '65%', cls: 'bg-[var(--color-gold)]' },
              { label: 'Global (7.5h)', width: '75%', cls: 'bg-white/40' },
              { label: 'Optimum (8h)', width: '80%', cls: 'bg-[var(--color-green)]' },
            ].map((bar) => (
              <div key={bar.label} className="flex items-center gap-3 text-sm">
                <span className="w-[90px] shrink-0" style={{ color: 'var(--color-muted)' }}>{bar.label}</span>
                <div
                  className="glass-panel flex-1 h-3 rounded-md overflow-hidden relative"
                  style={{ background: 'rgba(0,0,0,0.3)' }}
                >
                  <div
                    className={`absolute left-0 top-0 h-full rounded-md ${bar.cls}`}
                    style={{ width: bar.width, transition: 'width 1s ease-out' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="glass-card mb-4">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-semibold">Energy vs. Focus</h3>
            <div className="flex gap-1 p-1 rounded-xl bg-black/20 border border-white/5">
              {(['Today', '7 Days', 'This Month', 'This Year'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all duration-300 ${
                    timeRange === range
                      ? 'bg-[var(--color-gold)] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                      : 'text-muted hover:text-white hover:bg-white/5'
                  }`}
                >
                  {range === '7 Days' ? '7D' : range.replace('This ', '')}
                </button>
              ))}
            </div>
          </div>
          
          <div className="chart-wrapper w-full" style={{ height: 220 }}>
            <canvas id="insightsChart" ref={chartRef} />
          </div>
          
          <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--color-gold)] shadow-[0_0_8px_rgba(212,175,55,0.5)]" />
              <span className="text-[10px] text-muted uppercase tracking-wider">Energy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#EF4444] shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              <span className="text-[10px] text-muted uppercase tracking-wider">Stress</span>
            </div>
          </div>
        </div>

        {/* AI Insight */}
        <div
          className="glass-card mb-4 flex gap-4 items-start"
          style={{ background: 'rgba(212, 175, 55, 0.05)', borderColor: 'rgba(212, 175, 55, 0.2)' }}
        >
          <div
            className="text-2xl p-2.5 rounded-xl shrink-0"
            style={{ color: 'var(--color-gold)', background: 'rgba(212,175,55,0.1)' }}
          >
            <i className="fa-solid fa-wand-magic-sparkles" />
          </div>
          <div>
            <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--color-gold)' }}>
              Jeeva Intelligence
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: '#D1D5DB' }}>
              You are <strong>30% more focused</strong> on days when you log "Deep Sleep". Keep prioritizing your bedtime routine.
            </p>
          </div>
        </div>
      </main>
    </section>
  );
};

export default InsightsView;
