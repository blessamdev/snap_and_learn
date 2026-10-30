export type StudyMode = 'explain' | 'quiz' | 'check';

export interface MistakeCheck {
  praise?: string;
  first_error: string;
  why: string;
  hint: string;
  corrected_step: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer_index: number;
  explanation: string;
}

export interface AnalyzeResponse {
  success: boolean;
  model_used: string;
  readable: boolean;
  what_i_see: string;
  explanation_steps?: string[];
  mistake_check?: MistakeCheck | null;
  quiz?: QuizQuestion[];
  swahili_summary?: string;
  error?: string;
  message?: string;
}

export interface SampleTestCase {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  recommendedMode: StudyMode;
  suggestedQuestion: string;
  expectedBehavior: string;
  imageDataUrl: string;
}
