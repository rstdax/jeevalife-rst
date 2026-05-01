import React, { useState } from 'react';
import { sounds } from '../utils/audio';

interface DailyRemindersViewProps {
  onBack: () => void;
}

const DailyRemindersView: React.FC<DailyRemindersViewProps> = ({ onBack }) => {
  const [reminders, setReminders] = useState([
    { id: 1, title: 'Drink Water', time: '09:00 AM', enabled: true },
    { id: 2, title: 'Stretch Break', time: '12:30 PM', enabled: true },
    { id: 3, title: 'Meditation', time: '06:00 PM', enabled: false },
    { id: 4, title: 'Read a Book', time: '09:00 PM', enabled: true },
  ]);

  const toggleReminder = (id: number) => {
    sounds.click();
    setReminders(reminders.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  return (
    <section
      className="flex flex-col flex-1 px-6 pt-6 pb-[100px] h-full overflow-y-auto"
      style={{ animation: 'fadeIn 0.4s var(--ease-smooth) forwards' }}
    >
      <header className="flex items-center gap-4 mb-8">
        <button
          onClick={() => { sounds.click(); onBack(); }}
          className="w-10 h-10 flex justify-center items-center rounded-xl glass-panel text-muted hover:text-white transition-colors"
        >
          <i className="fa-solid fa-arrow-left" />
        </button>
        <h2 className="text-xl font-bold">Daily Reminders</h2>
      </header>

      <div className="flex flex-col gap-4">
        {reminders.map(reminder => (
          <div key={reminder.id} className="glass-card flex items-center justify-between p-4">
            <div className="flex flex-col">
              <span className="font-semibold">{reminder.title}</span>
              <span className="text-xs text-muted mt-1">{reminder.time}</span>
            </div>
            <div
              onClick={() => toggleReminder(reminder.id)}
              className={`toggle-switch relative w-[44px] h-[24px] rounded-xl cursor-pointer ${reminder.enabled ? 'active' : ''}`}
              style={{ background: reminder.enabled ? 'var(--color-green)' : 'rgba(255,255,255,0.1)' }}
            />
          </div>
        ))}
      </div>

      <button
        onClick={() => sounds.click()}
        className="mt-6 glass-panel py-4 rounded-xl text-center font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
      >
        <i className="fa-solid fa-plus text-[10px]" /> Add New Reminder
      </button>
    </section>
  );
};

export default DailyRemindersView;
