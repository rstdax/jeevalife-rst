import { useMemo, useState } from 'react';
import { sounds } from '../utils/audio';
import { emojis, journalLogs } from '../data';

const JournalView: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const calendarDays = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days: { day: number; emoji: string; cls: string }[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
      // Logic for simulated data: past days have moods, future/today might be empty
      const isFuture = (year > currentYear) || (year === currentYear && month > currentMonth) || (year === currentYear && month === currentMonth && i > new Date().getDate());
      
      const emoji = isFuture ? '' : emojis[Math.floor(Math.random() * 5)]; // Using 5 to include some 'meh' moods
      const cls = emoji === '😄' ? 'excellent' : emoji === '😢' ? 'low' : emoji === '' ? 'empty' : '';
      days.push({ day: i, emoji, cls });
    }
    return days;
  }, [selectedDate, currentMonth, currentYear]);

  const handleToggle = () => {
    sounds.click();
    setIsExpanded(!isExpanded);
  };

  const handlePrevMonth = () => {
    sounds.click();
    setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() - 1)));
  };

  const handleNextMonth = () => {
    sounds.click();
    setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() + 1)));
  };

  const handleResetToCurrent = () => {
    sounds.click();
    setSelectedDate(new Date());
  };

  return (
    <section
      id="journal-view"
      className="flex flex-col flex-1 px-6 pt-6 pb-[100px] h-full overflow-y-auto"
      style={{ animation: 'fadeIn 0.4s var(--ease-smooth) forwards' }}
    >
      <header className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Your Journey</h2>
      </header>

      <main>
        {/* Mood Calendar */}
        <div className="glass-card mb-4">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-semibold">Mood Calendar</h3>
            <button
              id="toggle-calendar"
              onClick={handleToggle}
              className="bg-transparent border-none font-semibold text-xs cursor-pointer px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
              style={{ color: 'var(--color-gold)' }}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>

          {/* Month Selector */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center justify-between glass-panel p-2 rounded-xl" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <button 
                onClick={handlePrevMonth}
                className="w-8 h-8 flex justify-center items-center rounded-lg hover:bg-white/5 text-muted transition-colors"
              >
                <i className="fa-solid fa-chevron-left text-xs" />
              </button>
              
              <div className="flex flex-col items-center">
                <span className="text-sm font-bold tracking-tight">
                  {months[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                </span>
                { (selectedDate.getMonth() !== currentMonth || selectedDate.getFullYear() !== currentYear) && (
                  <button 
                    onClick={handleResetToCurrent}
                    className="text-[10px] uppercase tracking-widest font-bold mt-0.5"
                    style={{ color: 'var(--color-gold)' }}
                  >
                    Go to Today
                  </button>
                )}
              </div>

              <button 
                onClick={handleNextMonth}
                className="w-8 h-8 flex justify-center items-center rounded-lg hover:bg-white/5 text-muted transition-colors"
              >
                <i className="fa-solid fa-chevron-right text-xs" />
              </button>
            </div>
          </div>
          <div
            id="calendar-grid"
            className="grid gap-2 mt-4 transition-all duration-300"
            style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}
          >
            {calendarDays.map((day, i) => {
              // In collapsed mode, hide items after 14th
              if (!isExpanded && i >= 14) return null;

              let bgStyle = 'rgba(255,255,255,0.05)';
              let borderStyle = 'var(--color-glass-border)';
              let opacityStyle = 1;

              if (day.cls === 'excellent') {
                bgStyle = 'rgba(16, 185, 129, 0.2)';
                borderStyle = 'var(--color-green)';
              } else if (day.cls === 'low') {
                bgStyle = 'rgba(239, 68, 68, 0.2)';
                borderStyle = '#EF4444';
              } else if (day.cls === 'empty') {
                opacityStyle = 0.3;
              }

              return (
                <div key={day.day} className="flex flex-col items-center gap-1">
                  {isExpanded && (
                    <span className="text-[0.65rem]" style={{ color: 'var(--color-muted)' }}>
                      {day.day}
                    </span>
                  )}
                  <div
                    className="w-full aspect-square rounded-full flex justify-center items-center text-lg"
                    style={{
                      background: bgStyle,
                      border: `1px solid ${borderStyle}`,
                      opacity: opacityStyle,
                    }}
                  >
                    {day.emoji}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Logs */}
        <h3 className="text-base font-semibold mb-4">Recent Logs</h3>
        <div
          id="journal-list"
          className="flex flex-col gap-5 pl-5"
          style={{ borderLeft: '2px solid var(--color-glass-border)' }}
        >
          {journalLogs.map((log, i) => (
            <div key={i} className="log-item relative">
              <div className="text-sm mb-1" style={{ color: 'var(--color-gold)' }}>
                {log.date}
              </div>
              <div
                className="p-3 rounded-xl text-sm leading-relaxed"
                style={{
                  background: 'var(--color-glass-bg)',
                  border: '1px solid var(--color-glass-border)',
                }}
              >
                {log.text}
              </div>
            </div>
          ))}
        </div>
      </main>
    </section>
  );
};

export default JournalView;
