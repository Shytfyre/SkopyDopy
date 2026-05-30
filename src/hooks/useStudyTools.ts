import { useState, useCallback } from 'react';
import { StudyEngine } from '../lib/study-engine';
import { useWebLLM } from './useWebLLM';

export interface Flashcard {
  front: string;
  back: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export function useStudyTools(sendMessage: ReturnType<typeof useWebLLM>['sendMessage']) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateFlashcards = useCallback(async (text: string): Promise<Flashcard[]> => {
    setIsGenerating(true);
    try {
      const prompt = StudyEngine.getFlashcardPrompt(text);
      const response = await sendMessage([{ role: 'user', content: prompt }]);
      
      // Clean up potential markdown formatting or prefix text
      let jsonStr = response;
      const match = response.match(/\[[\s\S]*\]/);
      if (match) {
        jsonStr = match[0];
      }
      
      return JSON.parse(jsonStr);
    } catch (err) {
      console.error("Failed to generate flashcards", err);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [sendMessage]);

  const generateQuiz = useCallback(async (text: string, difficulty: string = 'medium'): Promise<QuizQuestion[]> => {
    setIsGenerating(true);
    try {
      const prompt = StudyEngine.getQuizPrompt(text, difficulty);
      const response = await sendMessage([{ role: 'user', content: prompt }]);
      
      let jsonStr = response;
      const match = response.match(/\[[\s\S]*\]/);
      if (match) {
        jsonStr = match[0];
      }
      
      return JSON.parse(jsonStr);
    } catch (err) {
      console.error("Failed to generate quiz", err);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [sendMessage]);

  const generateSummary = useCallback(async (text: string, style: 'brief' | 'detailed' | 'bullet' | 'eli5'): Promise<string> => {
    const prompt = StudyEngine.getSummaryPrompt(text, style);
    return await sendMessage([{ role: 'user', content: prompt }]);
  }, [sendMessage]);
  
  const explainProblem = useCallback(async (text: string): Promise<string> => {
    const prompt = StudyEngine.getProblemExplainerPrompt(text);
    return await sendMessage([{ role: 'user', content: prompt }]);
  }, [sendMessage]);

  return { isGenerating, generateFlashcards, generateQuiz, generateSummary, explainProblem };
}
