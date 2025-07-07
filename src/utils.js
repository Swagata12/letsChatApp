// List of prohibited words (expand as needed)
export const PROHIBITED_WORDS = [
  'badword1',
  'badword2',
  'offensive',
  'prohibited',
  // Add more as needed
];

export function containsProhibitedContent(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return PROHIBITED_WORDS.some(word => lower.includes(word));
} 