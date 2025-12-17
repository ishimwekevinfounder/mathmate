
export interface MathStep {
  math: string;
  explanation: string;
  why: string;
  symbolsIntroduced: string[];
}

export interface MathResponse {
  originalEquation: string;
  formattedEquation: string;
  steps: MathStep[];
  overallConcept: string;
  encouragement: string; // New field for positive affirmations
}

export interface HintResponse {
  hint: string;
  guidingQuestion: string;
  encouragement: string; // New field for positive affirmations
}

export type TutorMode = 'solve' | 'hint';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'math-solution' | 'hint';
  data?: MathResponse | HintResponse;
}
