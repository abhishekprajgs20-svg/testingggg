// QUIZINOX Study Suite (v3.2): navigation constants. Pages are lazy-loaded from ./index.js.
export const STUDIO_NAV = [
  ['notes', '🗒', 'Notes'], ['vault', '🗄', 'Knowledge Vault'], ['teach', '🎓', 'QUIZINOX Teacher'],
  ['roadmap', '🧭', 'Exam Roadmap'], ['debate', '🗣', 'Discussion Room'], ['studio', '🛠', 'Content Studio'],
];
export const STUDIO_TABS = STUDIO_NAV.map(x => x[0]);
export const STUDIO_LABELS = { notes: 'Notes — notebooks, sections & sub-sections', vault: 'Personal Knowledge Vault', teach: 'QUIZINOX Teacher · Teach Me', roadmap: 'Exam Countdown Roadmap', debate: 'Discussion Room · Debate with AI', studio: 'Content Creator Studio' };
