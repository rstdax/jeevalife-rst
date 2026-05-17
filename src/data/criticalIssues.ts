export interface CriticalIssue {
  question: string;
  issue: string;
  advice: string;
  actionPlan: string[];
}

export const criticalIssues: Record<string, CriticalIssue> = {
  sleep: {
    question: "Sleep",
    issue:
      "You are likely running on 'borrowed time' or adrenaline. High mood and energy with no sleep is a recipe for a sudden crash or burnout. Your body is performing without recovering.",
    advice:
      "You're performing at your peak, but your foundation is shaking. High performance without sleep is like driving a supercar on an empty tank. The crash is coming — unless you act now.",
    actionPlan: [
      "Avoid caffeine after 2:00 PM today — it's silently sabotaging your sleep cycle.",
      "Set a 'Hard Stop' for all screens 60 minutes before bed tonight.",
      "Your body needs recovery to maintain this streak — protect your sleep like a non-negotiable meeting.",
    ],
  },

  stress: {
    question: "Stress",
    issue:
      "You are technically capable and rested, but mentally redlining. This often leads to unexplained physical illness or sudden irritability. You are carrying a heavy mental load despite your productivity.",
    advice:
      "Your metrics are excellent, but your internal 'pressure valve' is at its limit. High output shouldn't come at the cost of peace. You are one bad moment away from snapping — let's release the pressure before it releases itself.",
    actionPlan: [
      "Practice 'Physiological Sighs' right now: two quick inhales through the nose, one long exhale through the mouth — repeat 5 times.",
      "Delegate or postpone one task today that isn't truly urgent.",
      "Take a 5-minute walk outside — physical movement is the fastest way to lower cortisol.",
    ],
  },

  energy: {
    question: "Energy",
    issue:
      "The mind is willing, but the flesh is weak. Your motivation and mood are intact, but your physical battery is critically low. This could be due to poor nutrition, lack of movement, or the early signs of illness.",
    advice:
      "Your mindset is sharp, but your physical battery is critically low. Don't try to 'power through' — it will only lower your Focus score tomorrow. Rest is not laziness; it is strategy.",
    actionPlan: [
      "Check your hydration immediately — drink a full glass of water right now.",
      "Opt for a high-protein snack (nuts, eggs, yogurt) and avoid sugar which will cause a deeper crash.",
      "Take a 10-minute 'Non-Sleep Deep Rest' (NSDR) session — lie down, close your eyes, and breathe slowly. Keep physical exertion minimal today.",
    ],
  },

  mood: {
    question: "Mood",
    issue:
      "You are 'going through the motions.' You are efficient and rested, but emotionally disconnected or experiencing a deep dip in happiness. This is often the precursor to clinical burnout — the body works but the soul is absent.",
    advice:
      "You are highly functional today, but your emotional tank is empty. Checking off tasks might feel robotic or meaningless right now. Productivity is a tool, not the goal — wellbeing is. You cannot pour from an empty cup.",
    actionPlan: [
      "Seek a 'Micro-Connection' — text a close friend, spend 5 minutes with a pet, or step outside into nature for fresh air.",
      "Avoid social media and doom-scrolling, which will only deepen the emotional dip.",
      "Focus on one thing that brings you genuine comfort today — not utility, not productivity, just comfort.",
    ],
  },

  focus: {
    question: "Focus",
    issue:
      "You feel great and have energy, but your mind is 'ping-ponging' between thoughts. You have the fuel but no steering wheel. This usually happens due to digital overstimulation, too many open loops, or lack of clear prioritisation.",
    advice:
      "Your spirits and energy are high, but your attention is fragmented. You have the engine of a jet but no flight path. Trying to multi-task right now will only lead to frustration and wasted energy.",
    actionPlan: [
      "Perform a 'Brain Dump' — write down every single thing on your mind for 2 minutes to clear the mental RAM.",
      "Pick ONE task and set a 25-minute Pomodoro timer. Close all browser tabs not related to that task.",
      "Put your phone on Do Not Disturb for the next 30 minutes. Fragmented attention is the enemy of deep work.",
    ],
  },
};

export const lowScoreMessage = {
  title: "Your Jeeva Score Needs Attention",
  message:
    "Your overall wellness score is critically low today. This level of distress across multiple areas is a sign that your mind and body need professional support. Please consider speaking with a therapist or doctor near you. You are not alone, and help is available.",
  cta: "Find a Therapist Near You",
};

export const criticalAlertMessage = (username: string) =>
  `🚨 JeevaLife Alert: ${username} has been showing signs of serious mental distress for 3 consecutive days. Their wellness score has been critically low. Please reach out to them, have a conversation, or help them consult a mental health professional. This message was sent automatically by JeevaLife.`;

// ── 2-critical combinations ────────────────────────────────────────────────
export interface CombinedIssue {
  keys: string[];   // sorted pair e.g. ['sleep', 'stress']
  title: string;
  issue: string;
  advice: string;
  actionPlan: string[];
}

export const combinedIssues: CombinedIssue[] = [
  {
    keys: ['sleep', 'stress'],
    title: 'The Brittle Performer',
    issue:
      "This is the highest burnout risk. You have no physical recovery (Sleep) and high mental tension (Stress). This combination leads to cognitive impairment and potential physical illness — your body has no buffer left.",
    advice:
      "Your system is redlining without a safety net. High stress combined with zero sleep is a recipe for physical collapse. You are not tired — you are depleted.",
    actionPlan: [
      "Mandatory Disconnect — cancel or postpone one non-essential meeting or commitment today.",
      "Use a guided Yoga Nidra session for 20 minutes to force your nervous system into 'Parasympathetic' (rest) mode.",
      "No screens after sunset tonight. Your brain needs darkness to produce melatonin and begin recovery.",
    ],
  },
  {
    keys: ['energy', 'mood'],
    title: 'The Despondent Exhaustion',
    issue:
      "Both your mind and body are empty. This often manifests as lethargy or anhedonia — a complete inability to feel motivated or find pleasure. You are likely feeling like you are running on fumes emotionally and physically.",
    advice:
      "You are in a deep depletion phase. Your mind and body have synchronised in a 'Shutdown' signal. Pushing harder right now will only deepen the hole.",
    actionPlan: [
      "Focus only on biological needs — eat a warm, nutritious meal as your first priority.",
      "Sit in direct sunlight for 10 minutes. Natural light triggers serotonin and signals your body to reset.",
      "Do not attempt 'productivity' today. Your only task is gentle restoration — your only goal is to feel slightly better than right now.",
    ],
  },
  {
    keys: ['focus', 'stress'],
    title: 'The Chaotic Adrenaline',
    issue:
      "High anxiety mixed with a scattered mind. You are likely 'panic-working' — doing a lot of things but finishing nothing. The stress is creating urgency, but the lack of focus means that urgency has no direction.",
    advice:
      "Your mind is spinning its wheels in the mud. High tension and low focus create 'Busy-Work' that yields no results and drains you further.",
    actionPlan: [
      "Stop everything right now. Write a 'Done' list of everything you have already completed or stressed about today.",
      "Pick one single physical task — like cleaning your desk or making tea — to regain a sense of control.",
      "Only after the physical task, return to digital work with one clearly defined next action.",
    ],
  },
  {
    keys: ['focus', 'sleep'],
    title: 'The Zombie Mode',
    issue:
      "The brain fog you are experiencing is caused by biological debt. Trying to focus is medically difficult right now because your prefrontal cortex — the part responsible for decision-making and concentration — is underpowered from lack of sleep.",
    advice:
      "You are operating in a cognitive 'blackout.' Your lack of focus is a direct symptom of sleep deprivation, not a character flaw. You cannot think your way out of a biological problem.",
    actionPlan: [
      "Take a 20-minute power nap before 3:00 PM — set an alarm so you don't oversleep.",
      "If you cannot nap, use 'Cold Exposure' — splash ice-cold water on your face to force temporary alertness.",
      "Prioritise an 8:00 PM wind-down tonight. Tonight's sleep is the only real fix.",
    ],
  },
  {
    keys: ['focus', 'mood'],
    title: 'The Socially Drained',
    issue:
      "Emotional low combined with mental scattering. You likely feel 'checked out' and unable to care about your responsibilities. Your mood is casting a shadow over your ability to think clearly.",
    advice:
      "Your mental clarity is being shadowed by your emotional state. It's hard to aim when you don't feel connected to the target. The focus problem is a symptom — the mood is the root cause.",
    actionPlan: [
      "Environment Shift — move to a different room, a cafe, or anywhere that isn't your current space.",
      "Listen to Lo-Fi music or Brown Noise to drown out internal emotional chatter.",
      "Set one small, achievable goal to get a 'micro-win' of dopamine — something you can finish in under 10 minutes.",
    ],
  },

  // ── 3-critical combinations ──────────────────────────────────────────────
  {
    keys: ['energy', 'mood', 'sleep'],
    title: 'The Deep Void',
    issue:
      "Your emotional and physical batteries are completely flat. You are likely feeling numb and physically heavy. Both your mind and body have entered a simultaneous shutdown — there is no fuel left on any level.",
    advice:
      "You are in a complete shutdown state. Your system has no remaining emotional or physical capacity. Pushing through is not an option — recovery is the only path forward.",
    actionPlan: [
      "Sleep is your absolute top priority right now — everything else can wait.",
      "Take a 24-hour break from work and social obligations. Protect your recovery time.",
      "Avoid all stimulation — no screens, no news, no social media. Allow full, uninterrupted restoration.",
    ],
  },
  {
    keys: ['focus', 'sleep', 'stress'],
    title: 'The Cognitive Crash',
    issue:
      "You are running on pure cortisol. Your brain cannot process information due to lack of rest and high pressure. The combination of sleep deprivation and stress has made cognitive function nearly impossible.",
    advice:
      "Your brain is overloaded and exhausted. Without rest, your cognitive system cannot function properly. You are not failing — your hardware is simply offline.",
    actionPlan: [
      "Sit in a dark, quiet room for 30 minutes — no phone, no music, no light.",
      "Focus only on slow, deep breathing to lower cortisol levels.",
      "Force a mental reset before attempting any cognitive work today.",
    ],
  },
  {
    keys: ['focus', 'mood', 'stress'],
    title: 'The Emotional Storm',
    issue:
      "You are mentally trapped. High stress is destroying your mood and making focus impossible. The emotional overload has created a feedback loop — stress kills mood, low mood kills focus, and lack of focus increases stress.",
    advice:
      "Your emotional overload is clouding your thinking and blocking all clarity. You cannot think your way out of a feeling — you must release it first.",
    actionPlan: [
      "Write down every single thought on paper — no filter, no editing, just dump it all out.",
      "Physically tear or crumple the paper to release the tension stored in your body.",
      "Change your environment immediately — a new space breaks the mental loop.",
    ],
  },
  {
    keys: ['energy', 'focus', 'sleep'],
    title: 'The Biological Debt',
    issue:
      "This is a physical shutdown signal. Your body is forcing rest to protect itself. The combination of low energy, poor focus, and no sleep means your biology has overridden your willpower.",
    advice:
      "Your system is in survival mode. Cognitive performance is disabled to conserve energy. This is not a mindset problem — it is a biological emergency.",
    actionPlan: [
      "Drink electrolytes immediately — your cells need minerals to function.",
      "Eat a high-protein meal to give your body the building blocks for recovery.",
      "Sleep before 8:00 PM tonight and avoid all exercise until you have recovered.",
    ],
  },
  {
    keys: ['energy', 'mood', 'stress'],
    title: 'The Exhausted Mind',
    issue:
      "You are physically tired but mentally overactive and emotionally low. This 'tired but wired' state is one of the most uncomfortable combinations — your body wants to rest but your mind won't stop.",
    advice:
      "You are in a 'tired but wired' state, which creates deep internal imbalance and stress. The nervous system is stuck between 'fight-or-flight' and 'collapse' — you need to manually switch it off.",
    actionPlan: [
      "Use cold exposure — splash ice-cold water on your face or hold ice cubes for 30 seconds to activate the dive reflex.",
      "Practice slow, extended exhales — breathe in for 4 counts, out for 8 counts, repeat 5 times.",
      "Calm your nervous system before attempting any task — your body must feel safe before your mind can rest.",
    ],
  },
];

// Helper — find combination issue for a given set of critical keys
export function findCombinedIssue(criticalKeys: string[]): CombinedIssue | null {
  if (criticalKeys.length < 2) return null;
  const sorted = [...criticalKeys].sort();
  return combinedIssues.find(c => {
    const cs = [...c.keys].sort();
    if (cs.length !== sorted.length) return false;
    return cs.every((k, i) => k === sorted[i]);
  }) ?? null;
}
