// Shared AI vocabulary: response modes (assistant / doubt boxes), explanation styles for generated questions, verbal-reasoning question types.
export const RESPONSE_MODES = {
  simple: ['Explain Simply', 'Explain in very simple language for a beginner, with a one-line summary at the end.'],
  detailed: ['Detailed Explanation', 'Give a detailed, well-structured explanation with headings.'],
  prelims: ['Prelims Perspective', 'Focus on facts, traps, keywords and how MCQs are framed; add likely statement-style pointers.'],
  mains: ['Mains Perspective', 'Write like a Mains answer: introduction, multi-dimensional body, examples, way forward.'],
  concept: ['Conceptual Explanation', 'Explain the underlying concept, logic and linkages.'],
  compare: ['Compare Two Concepts', 'Compare in a Markdown table, then key differences and when each applies.'],
  examples: ['Explain with Examples', 'Explain using concrete Indian examples and case studies.'],
  timeline: ['Explain with Timeline', 'Give a chronological timeline with years, then brief significance. Only dates you are sure of.'],
  table: ['Explain with Table', 'Organise the answer in Markdown table(s).'],
  notes: ['Create Short Revision Notes', 'Crisp revision notes: bullets, key terms in bold, a "Remember" box.'],
  steps: ['Step-by-step', 'Explain step by step, numbering each step.'],
  advice: ['Advice & Next Steps', 'Give practical advice: what to do next, what to avoid, what resources (books/sources) to add, in priority order.'],
  quiz: ['Quiz Me', 'Ask 5 short questions on this one at a time style list (all questions first, answers at the end).'],
  hinglish: ['Hinglish (Hindi in English letters)', 'Reply in Hinglish: Hindi written in Roman script mixed with English.'],
};
export const LENGTHS = { short: ['Short', 'Keep it under 120 words.'], normal: ['Normal', 'Keep it under 350 words.'], long: ['Long', 'Be thorough (up to ~800 words).'] };
export const EXPL_TYPES = {
  detailed: ['Detailed (why right + why others wrong)', 'Explain in 4–6 sentences why the correct option is right AND why each other option is wrong, plus one related fact worth remembering.', 6],
  short: ['Short (1–3 lines)', '1–3 crisp sentences.', 10],
  extended: ['Extended deep-dive (option analysis + topic info)', 'Write a long explanation (8–14 sentences): first the correct answer and why; then an option-by-option analysis (each option: true/false and why); then background of the topic, 3–4 related facts, a common trap, and what to read further.', 4],
  optionwise: ['Option-wise analysis', 'Analyse EVERY option separately in the form "(A) ... — correct/incorrect because ...", then a one-line takeaway.', 6],
  concept: ['Concept & background', 'Explain the core concept behind the question, its background/history, key terms and 2–3 linked topics useful for the exam.', 5],
  trick: ['Trick / shortcut / elimination', 'Explain the fastest way to solve it: elimination logic, keywords, shortcut or mnemonic, and what the examiner is testing.', 8],
  prelims: ['Prelims trap view', 'Explain the correct answer, the trap in each wrong option, and how UPSC usually frames such statements.', 6],
  mains: ['Mains / analytical angle', 'Explain the answer, then add an analytical paragraph on how the topic can be used in a Mains answer (dimensions, examples, data).', 5],
  stepwise: ['Step-by-step reasoning', 'Show the solution as numbered steps (working for numerical/reasoning questions; logic chain for factual ones), then the final answer.', 6],
  oneline: ['One-line fact + source hint', 'One sentence with the key fact, plus the standard source/book where it can be verified.', 10],
};
export const explRule = k => (EXPL_TYPES[k] || EXPL_TYPES.detailed)[1];
export const explPer = k => (EXPL_TYPES[k] || EXPL_TYPES.detailed)[2];
export const VERBAL_TYPES = {
  vr_series: { label: '🔤 Number / letter series', rule: 'Verbal reasoning: a number series, letter series or alpha-numeric series with ONE missing term. State the series in the question. The rule must be unique; verify the answer by recomputing it before writing.' },
  vr_coding: { label: '🔤 Coding–decoding', rule: 'Verbal reasoning: coding-decoding. Give a code rule through 1–2 examples (letters shifted, words substituted or numbers) and ask the code of a new word. Verify your answer by applying the rule step by step.' },
  vr_blood: { label: '🔤 Blood relations', rule: 'Verbal reasoning: blood-relation puzzle with 3–5 clearly stated statements and a single definite relationship answer. Double-check generation/gender logic.' },
  vr_direction: { label: '🔤 Direction & distance', rule: 'Verbal reasoning: direction-sense problem (turns, distances) asking for final direction or distance from start. Use only N/E/S/W and simple distances; recompute with coordinates.' },
  vr_syll: { label: '🔤 Syllogism', rule: 'Verbal reasoning: syllogism with 2–3 statements and 2 conclusions (I and II); options like "Only I follows", "Only II follows", "Both follow", "Neither follows". Verify with Venn-diagram logic.' },
  vr_seat: { label: '🔤 Seating / ranking order', rule: 'Verbal reasoning: linear seating or ranking (5–6 people) with 4–5 conditions that yield a UNIQUE arrangement; ask a position/neighbour question. Verify uniqueness.' },
  vr_class: { label: '🔤 Classification / odd word', rule: 'Verbal reasoning: odd-one-out among words, numbers or letter groups with a single logical basis.' },
  vr_analogy: { label: '🔤 Verbal analogy', rule: 'Verbal reasoning: analogy (word:word or number:number or letter-group) with 4 options and one clearly determinable relation.' },
  vr_math: { label: '🔤 Mathematical operations / equality', rule: 'Verbal reasoning: symbol substitution or operator-swapping equation, or a letter-number arrangement test; state the rule in the question and verify the final value.' },
  vr_venn: { label: '🔤 Venn / data arrangement', rule: 'Verbal reasoning: describe 3 groups with overlaps in words (e.g., people who like tea/coffee/juice with counts) and ask a count or relation. All numbers must be consistent.' },
};
