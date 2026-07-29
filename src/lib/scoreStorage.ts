// src/lib/scoreStorage.ts

export interface ModuleScore {
  moduleId: string;      // e.g., 'warmup_psyas_lvl1'
  score: number;         // Raw score (e.g., 20)
  totalQuestions: number; // Total questions in that set
  rating: number;        // PRC Rating (1-9)
  timestamp: number;     // When it was completed
}

// Save a score after completing a quiz
export const saveModuleScore = (scoreData: ModuleScore) => {
  try {
    const existingScores = JSON.parse(localStorage.getItem('quiz_scores') || '{}');
    existingScores[scoreData.moduleId] = scoreData;
    localStorage.setItem('quiz_scores', JSON.stringify(existingScores));
    
    // Optional: Sync to Supabase when online
    // await supabase.from('user_scores').upsert(scoreData);
  } catch (err) {
    console.error('Failed to save score:', err);
  }
};

// Get all stored scores
export const getAllScores = (): Record<string, ModuleScore> => {
  try {
    return JSON.parse(localStorage.getItem('quiz_scores') || '{}');
  } catch {
    return {};
  }
};

// Get specific module score
export const getModuleScore = (moduleId: string): ModuleScore | null => {
  const scores = getAllScores();
  return scores[moduleId] || null;
};