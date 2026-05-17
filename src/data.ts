import type { Question, JournalLog } from './types';

export const questions: Question[] = [
  {
    q: "How's your mood right now?",
    opts: [
      { e: "✨", t: "Radiant" },
      { e: "😊", t: "Content" },
      { e: "😔", t: "Low" },
      { e: "😤", t: "Disturbed" },
    ],
  },
  {
    q: "How is your energy flowing?",
    opts: [
      { e: "🔥", t: "High" },
      { e: "⚡", t: "Blended" },
      { e: "🪫", t: "Sluggish" },
      { e: "😮‍💨", t: "Exhausted" },
    ],
  },
  {
    q: "What's your stress level?",
    opts: [
      { e: "🧘", t: "Relaxed" },
      { e: "😌", t: "Manageable" },
      { e: "😬", t: "Tensed" },
      { e: "🌊", t: "Overwhelmed" },
    ],
  },
  {
    q: "How was your sleep quality?",
    opts: [
      { e: "🔆", t: "7-9 Hours" },
      { e: "🙂", t: "6-7 Hours" },
      { e: "😶‍🌫️", t: "4-6 Hours" },
      { e: "🌫️", t: "Less than 4 Hours" },
    ],
  },
  {
    q: "How was your focus today?",
    opts: [
      { e: "🎯", t: "Laser Sharp" },
      { e: "🧠", t: "Focused" },
      { e: "�", t: "Distracted" },
      { e: "🌀", t: "Scattered" },
    ],
  },
];

export const journalLogs: JournalLog[] = [
  { date: 'Today, 8:00 AM', text: 'Woke up feeling refreshed. Need to focus on the big presentation today. 🎯' },
  { date: 'Yesterday, 9:30 PM', text: 'Evening felt a bit chaotic, but reading before bed helped me calm down. 📚' },
  { date: 'Monday, 7:15 AM', text: 'Great energy post-workout. Ready to tackle the week. ⚡' },
];

export const emojis = ['😄', '🙂', '😐', '😢', ''];
