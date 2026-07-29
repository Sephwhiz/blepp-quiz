// src/lib/shuffleUtils.ts

// ✅ Fisher-Yates Shuffle Algorithm (Unbiased randomization)
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array]; // Create copy to avoid mutating original
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// ✅ Shuffle Questions AND Map Correct Answers
export interface ShuffledQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer: string | number; // Original answer
  mappedCorrectIndex: number;     // NEW: Where the correct answer is NOW
  explanation?: string;
  domain?: string;
  level?: number;
}

export const shuffleQuestionsWithAnswers = (questions: any[]): ShuffledQuestion[] => {
  // 1. Shuffle the question order
  const shuffledQuestions = shuffleArray(questions);

  // 2. For each question, shuffle its options and track where the correct answer went
  return shuffledQuestions.map(q => {
    // ✅ FIX: Cast q.options to string[] so TypeScript knows the type
    const optionsWithIndices = (q.options as string[]).map((opt: string, idx: number) => ({
      text: opt,
      originalIndex: idx
    }));

    // Shuffle the options
    const shuffledOptions = shuffleArray(optionsWithIndices);

    // Find where the correct answer ended up
    const correctOriginalIndex = getCorrectAnswerIndex(q.correct_answer);
    const newCorrectIndex = shuffledOptions.findIndex(opt => opt.originalIndex === correctOriginalIndex);

    return {
      ...q,
      options: shuffledOptions.map(opt => opt.text), // Extract just the text
      mappedCorrectIndex: newCorrectIndex >= 0 ? newCorrectIndex : 0 // Fallback
    };
  });
};

// ✅ Helper to normalize correct_answer to index (0-3)
const getCorrectAnswerIndex = (answer: string | number): number => {
  if (typeof answer === 'number') {
    return answer >= 0 && answer <= 3 ? answer : answer - 1;
  }
  
  const strVal = String(answer).trim().toUpperCase();
  const map: Record<string, number> = { 
    'A': 0, 'B': 1, 'C': 2, 'D': 3,
    '1': 0, '2': 1, '3': 2, '4': 3 
  };
  return map[strVal] ?? 0;
};