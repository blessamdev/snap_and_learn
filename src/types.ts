export type StudyMode = 'explain' | 'quiz' | 'check';

export interface MistakeCheck {
  first_error: string | null;
  why: string | null;
  hint: string | null;
  corrected_step: string | null;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer_index: number;
  explanation: string;
}

export interface AnalyzeResponse {
  mode: StudyMode;
  readable: boolean;
  unreadable_reason: string | null;
  subject: string;
  topic: string;
  what_i_see: string;
  explanation_steps: string[];
  mistake_check: MistakeCheck;
  quiz: QuizQuestion[];
  swahili_summary: string | null;
  confidence_note: string | null;
  model_used?: string;
  success?: boolean;
  error?: string;
  message?: string;
}

export interface StudentProfile {
  institution: string;
  country: string;
  programme: string;
  level: string;
  year: string;
  currentUnits: string;
}

export interface FollowUpMessage {
  id: string;
  sender: 'user' | 'tutor';
  text: string;
  timestamp: number;
}

// Phase 3 Architecture: Curriculum Compass (Ready for future expansion)
export interface CurriculumTopic {
  id: string;
  unitCode: string;
  topicTitle: string;
  learningObjectives: string[];
  masteryLevel: 'not_started' | 'in_progress' | 'mastered';
  notesCount: number;
}

export interface CurriculumCourse {
  courseCode: string;
  courseTitle: string;
  institution: string;
  semester: string;
  topics: CurriculumTopic[];
}

export interface SampleTestCase {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  subjectCategory?: string;
  recommendedMode: StudyMode;
  suggestedQuestion: string;
  expectedBehavior: string;
  imageDataUrl: string;
}
