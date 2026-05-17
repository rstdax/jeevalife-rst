import React, { useState, useEffect } from 'react';
import { sounds } from '../utils/audio';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import {
  collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc,
} from 'firebase/firestore';

interface DailyRemindersViewProps {
  onBack: () => void;
}

interface Reminder {
  id: string;
  title: string;
  time: string;
  enabled: boolean;
  created_at?: string;
}

const DailyRemindersView: React.FC<DailyRemindersViewProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newHour, setNewHour] = useState('08');
  const [newMinute, setNewMinute] = useState('00');
  const [newPeriod, setNewPeriod] = useState<'AM' | 'PM'>('AM');
  const [isSaving, setIsSaving] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'reminders'),
      where('user_id', '==', user.uid),
    );
    getDocs(q).then(snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Reminder));
      // sort in JS — no index needed
      data.sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''));
      setReminders(data);
      setIsLoading(false);
    }).catch(err => {
      console.error('reminders fetch error:', err);
      setIsLoading(false);
    });
  }, [user]);

  useEffect(() => {
    if ('Notification' in window) setNotifPermission(Notification.permission);
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
  };

  const handleToggle = async (id: string, current: boolean) => {
    sounds.click();
    setReminders(prev => prev.map(r => r.id === id ? { ...r, enabled: !current } : r));
    await updateDoc(doc(db, 'reminders', id), { enabled: !current });
  };

  const handleDelete = async (id: string) => {
    sounds.click();
    setReminders(prev => prev.filter(r => r.id !== id));
    await deleteDoc(doc(db, 'reminders', id));
  };

  const handleAdd = async () => {
    if (!user || !newTitle.trim()) return;
    setIsSaving(true);
    sounds.click();
    const displayTime = `${newHour}:${newMinute} ${newPeriod}`;
    try {
      const docRef = await addDoc(collection(db, 'reminders'), {
        user_id: user.uid,
        title: newTitle.trim(),
        time: displayTime,
        enabled: true,
        created_at: new Date().toISOString(),
      });
      sounds.success();
      setReminders(prev => [...prev, { id: docRef.id, title: newTitle.trim(), time: displayTime, enabled: true }]);
      setNewTitle(''); setNewHour('08'); setNewMinute('00'); setNewPeriod('AM');
      setShowAddForm(false);
    } catch { /* ignore */ }
    setIsSaving(false);
  };

  return (
    <section className="flex flex-col flex-1 px-6 pt-6 pb-[100px] h-full overflow-y-auto"
      style={{ animation: 'fadeIn 0.4s var(--ease-smooth) forwards' }}>
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => { sounds.click(); onBack(); }}
          className="w-10 h-10 flex justify-center items-center rounded-xl glass-panel text-muted hover:text-white transition-colors">
          <i className="fa-solid fa-arrow-left" />
        </button>
        <h2 className="text-xl font-bold">Daily Reminders</h2>
      </header>

      {notifPermission !== 'granted' && (
        <div className="glass-card mb-4 flex items-center gap-3"
          style={{ background: 'rgba(212,175,55,0.05)', borderColor: 'rgba(212,175,55,0.2)' }}>
          <i className="fa-solid fa-bell text-xl" style={{ color: 'var(--color-gold)' }} />
          <div className="flex-1">
            <p className="text-sm font-semibold">Enable Notifications</p>
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
              {notifPermission === 'denied' ? 'Notifications blocked. Enable in browser settings.' : 'Allow notifications to receive reminder alerts.'}
            </p>
          </div>
          {notifPermission !== 'denied' && (
            <button onClick={requestPermission} className="text-xs font-bold px-3 py-2 rounded-lg"
              style={{ background: 'var(--color-gold)', color: 'black' }}>Allow</button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--color-teal-light)', borderTopColor: 'transparent' }} />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reminders.map(r => (
            <div key={r.id} className="glass-card flex items-center justify-between p-4">
              <div className="flex flex-col flex-1">
                <span className="font-semibold">{r.title}</span>
                <span className="text-xs text-muted mt-0.5">{r.time}</span>
              </div>
              <div className="flex items-center gap-3">
                <div onClick={() => handleToggle(r.id, r.enabled)}
                  className={`toggle-switch relative w-[44px] h-[24px] rounded-xl cursor-pointer ${r.enabled ? 'active' : ''}`}
                  style={{ background: r.enabled ? 'var(--color-green)' : 'rgba(255,255,255,0.1)' }} />
                <button onClick={() => handleDelete(r.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg opacity-40 hover:opacity-100 transition-opacity"
                  style={{ color: '#EF4444' }}>
                  <i className="fa-solid fa-trash-can text-xs" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddForm && (
        <div className="glass-card mt-4 flex flex-col gap-4" style={{ animation: 'popIn 0.4s var(--ease-spring) forwards' }}>
          <h3 className="text-sm font-semibold">New Reminder</h3>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Title</label>
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
              className="glass-panel p-3 rounded-xl text-white outline-none border-none text-sm"
              style={{ background: 'rgba(255,255,255,0.05)' }} placeholder="e.g. Morning Walk" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Time</label>
            <div className="flex gap-2 items-center">
              <input type="number" min="1" max="12" value={newHour}
                onChange={e => setNewHour(e.target.value.padStart(2, '0').slice(-2))}
                className="glass-panel flex-1 p-3 rounded-xl text-white outline-none border-none text-sm text-center font-bold"
                style={{ background: 'rgba(255,255,255,0.08)' }} />
              <span className="text-white font-bold text-lg">:</span>
              <input type="number" min="0" max="59" value={newMinute}
                onChange={e => setNewMinute(String(Math.min(59, Math.max(0, parseInt(e.target.value) || 0))).padStart(2, '0'))}
                className="glass-panel flex-1 p-3 rounded-xl text-white outline-none border-none text-sm text-center font-bold"
                style={{ background: 'rgba(255,255,255,0.08)' }} />
              <div className="flex rounded-xl overflow-hidden border border-white/10">
                {(['AM', 'PM'] as const).map(p => (
                  <button key={p} type="button" onClick={() => { sounds.click(); setNewPeriod(p); }}
                    className="px-4 py-3 text-sm font-bold transition-all"
                    style={{ background: newPeriod === p ? 'var(--color-gold)' : 'rgba(255,255,255,0.05)', color: newPeriod === p ? 'black' : 'var(--color-muted)' }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { sounds.click(); setShowAddForm(false); }}
              className="flex-1 py-3 rounded-xl text-sm font-semibold glass-panel text-muted">Cancel</button>
            <button onClick={handleAdd} disabled={isSaving || !newTitle.trim()}
              className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-40"
              style={{ background: 'var(--color-gold)', color: 'black' }}>
              {isSaving ? <i className="fa-solid fa-circle-notch fa-spin" /> : 'Add Reminder'}
            </button>
          </div>
        </div>
      )}

      {!showAddForm && (
        <button onClick={() => { sounds.click(); setShowAddForm(true); }}
          className="mt-4 glass-panel py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors">
          <i className="fa-solid fa-plus text-xs" /> Add New Reminder
        </button>
      )}
    </section>
  );
};

export default DailyRemindersView;
