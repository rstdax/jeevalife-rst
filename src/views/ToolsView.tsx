import { useState } from 'react';

const ToolsView: React.FC = () => {
  const [waterValue, setWaterValue] = useState(1.5);
  const percentage = (waterValue / 4.0) * 100;

  return (
    <section
      id="tools-view"
      className="flex flex-col flex-1 px-6 pt-6 pb-[100px] h-full overflow-y-auto"
      style={{ animation: 'fadeIn 0.4s var(--ease-smooth) forwards' }}
    >
      <header className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Self Improvement</h2>
      </header>

      <main>
        {/* Water Tracker */}
        <div className="glass-card text-center mb-4" style={{ animation: 'fadeIn 0.4s var(--ease-smooth) forwards' }}>
          <h3 className="text-base font-semibold">Daily Hydration Tracker</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--color-muted)' }}>Stay liquid. Keep your flow state.</p>

          <div
            id="water-container"
            className="glass-panel relative mx-auto overflow-hidden"
            style={{
              width: 160,
              height: 160,
              borderRadius: '50%',
              border: '4px solid rgba(255,255,255,0.1)',
              background: 'rgba(0,0,0,0.3)',
              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
            }}
          >
            <div
              className="water-level absolute bottom-0 left-0 w-full transition-all duration-400"
              style={{
                height: `${percentage}%`,
                background: 'linear-gradient(to bottom, var(--color-cyan) 0%, #009efd 100%)',
                opacity: 0.9,
              }}
            />
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 font-extrabold text-4xl"
              style={{ fontFamily: 'var(--font-heading)', textShadow: '0 2px 5px rgba(0,0,0,0.5)' }}
            >
              {waterValue.toFixed(1)}<span className="text-base opacity-80">L</span>
            </div>
          </div>

          <input
            type="range"
            id="water-slider"
            className="custom-slider"
            min={0}
            max={4}
            step={0.1}
            value={waterValue}
            onChange={(e) => setWaterValue(parseFloat(e.target.value))}
          />
          <div className="flex justify-between text-sm" style={{ color: 'var(--color-muted)' }}>
            <span>0L</span>
            <span>Goal: 4.0L</span>
          </div>
        </div>

        {/* Journaling Prompt */}
        <div className="glass-card">
          <h3 className="text-base font-semibold">Journaling Prompt</h3>
          <textarea
            className="w-full mt-3 p-3 rounded-xl text-white resize-none"
            style={{
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid var(--color-glass-border)',
              fontFamily: 'var(--font-body)',
              outline: 'none',
            }}
            placeholder="What are you grateful for today?"
            rows={4}
            onFocus={(e) => (e.target.style.borderColor = 'var(--color-teal-light)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--color-glass-border)')}
          />
          <button
            className="w-full mt-2 flex justify-center items-center px-5 py-4 rounded-2xl text-white text-base cursor-pointer"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--color-glass-border)',
              transition: 'all 0.2s var(--ease-spring)',
            }}
          >
            Save Entry
          </button>
        </div>
      </main>
    </section>
  );
};

export default ToolsView;
