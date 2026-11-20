export const SYSTEM_PROMPT_JSON = (n, deck) => `Create ${n} high-quality UPSC flashcards for the deck "${deck}". Each card tests ONE fact or concept by active recall (not a multiple-choice question).
Return ONLY a JSON array: [{"front":"question/keyword/concept/date/article","back":"short answer","extra":"2-4 line explanation and additional facts","rel":"related information","upsc":"Prelims/Mains relevance"}].
Use only facts you are confident about. If the source text is given, use only that text. Do not invent article numbers, dates or statistics.`;
