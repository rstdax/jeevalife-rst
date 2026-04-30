import type { Question, JournalLog } from './types';

export const questions: Question[] = [
  {
    q: "How is your energy flowing?",
    opts: [
      { e: "🔋", t: "Empty" },
      { e: "🪫", t: "Low" },
      { e: "⚡", t: "Balanced" },
      { e: "🔥", t: "High" },
    ],
  },
  {
    q: "What's occupying your mind?",
    opts: [
      { e: "🌪️", t: "Chaos/Stress" },
      { e: "📱", t: "Distractions" },
      { e: "🧘", t: "Calm Focus" },
      { e: "🚀", t: "Excitement" },
    ],
  },
  {
    q: "How rested do you feel?",
    opts: [
      { e: "😫", t: "Exhausted" },
      { e: "🥱", t: "Groggy" },
      { e: "😌", t: "Okay" },
      { e: "✨", t: "Fully Restored" },
    ],
  },
];

export const journalLogs: JournalLog[] = [
  { date: 'Today, 8:00 AM', text: 'Woke up feeling refreshed. Need to focus on the big presentation today. 🎯' },
  { date: 'Yesterday, 9:30 PM', text: 'Evening felt a bit chaotic, but reading before bed helped me calm down. 📚' },
  { date: 'Monday, 7:15 AM', text: 'Great energy post-workout. Ready to tackle the week. ⚡' },
];

export const emojis = ['😄', '🙂', '😐', '😢', ''];
