// src/lib/prcRating.ts

import { ModuleScore } from './scoreStorage';

export interface PRCScore {
  percentage: number;
  rating: number; // 1-9
  label: string;
  color: string; // Tailwind color class for badges
}

/**
 * Calculates the PRC-style 9-point rating based on raw score and total questions.
 */
export function calculatePRCRating(score: number, totalQuestions: number): PRCScore {
  const percentage = Math.round((score / totalQuestions) * 100);
  
  if (percentage >= 96) return { percentage, rating: 9, label: 'Excellent', color: 'text-emerald-400 bg-emerald-900/30 border-emerald-700' };
  if (percentage >= 92) return { percentage, rating: 8, label: 'Very Good', color: 'text-green-400 bg-green-900/30 border-green-700' };
  if (percentage >= 88) return { percentage, rating: 7, label: 'Good', color: 'text-lime-400 bg-lime-900/30 border-lime-700' };
  if (percentage >= 84) return { percentage, rating: 6, label: 'Above Average', color: 'text-yellow-400 bg-yellow-900/30 border-yellow-700' };
  if (percentage >= 80) return { percentage, rating: 5, label: 'Average', color: 'text-orange-400 bg-orange-900/30 border-orange-700' };
  if (percentage >= 75) return { percentage, rating: 4, label: 'Passing', color: 'text-teal-400 bg-teal-900/30 border-teal-700' }; // ✅ PASSING LINE
  if (percentage >= 70) return { percentage, rating: 3, label: 'Below Passing', color: 'text-red-400 bg-red-900/30 border-red-700' };
  if (percentage >= 65) return { percentage, rating: 2, label: 'Poor', color: 'text-rose-400 bg-rose-900/30 border-rose-700' };
  return { percentage, rating: 1, label: 'Very Poor', color: 'text-gray-400 bg-gray-900/30 border-gray-700' };
}

/**
 * Gets a human-readable label for a given rating number (used in menus).
 */
export function getRatingLabel(rating: number): string {
  const labels: Record<number, string> = {
    9: 'Excellent',
    8: 'Very Good',
    7: 'Good',
    6: 'Above Average',
    5: 'Average',
    4: 'Passing',
    3: 'Below Passing',
    2: 'Poor',
    1: 'Very Poor'
  };
  return labels[rating] || 'Unknown';
}

/**
 * Calculates an aggregate PRC rating across multiple completed quiz attempts.
 * Useful for showing overall performance on a module (e.g., Warm Up Exam).
 */
export function getAggregateModuleRating(scores: ModuleScore[]): PRCScore | null {
  if (!scores || scores.length === 0) return null;

  const totalCorrect = scores.reduce((sum, s) => sum + s.score, 0);
  const totalQs = scores.reduce((sum, s) => sum + s.totalQuestions, 0);

  if (totalQs === 0) return null;

  return calculatePRCRating(totalCorrect, totalQs);
}