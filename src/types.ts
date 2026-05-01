export type ViewId = 'dashboard' | 'check-in' | 'tools' | 'insights' | 'journal' | 'profile' | 'daily-reminders' | 'onboarding' | 'sign-in' | 'sign-up';

export interface QuestionOption {
  e: string;
  t: string;
}

export interface Question {
  q: string;
  opts: QuestionOption[];
}

export interface JournalLog {
  date: string;
  text: string;
}
