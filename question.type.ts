// =============================================================================
// Question Types - Shared types for Backend & Frontend
// =============================================================================

// -----------------------------------------------------------------------------
// Enums & Constants
// -----------------------------------------------------------------------------

export type QuestionType = 'single' | 'multiple' | 'essay';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type PublishStatus = 'draft' | 'published';

// -----------------------------------------------------------------------------
// Strapi Blocks (Rich Text) Types
// -----------------------------------------------------------------------------

export interface TextNode {
  type: 'text';
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
}

export interface LinkNode {
  type: 'link';
  url: string;
  children: TextNode[];
}

export interface ListItemNode {
  type: 'list-item';
  children: (TextNode | LinkNode)[];
}

export interface ParagraphBlock {
  type: 'paragraph';
  children: (TextNode | LinkNode)[];
}

export interface HeadingBlock {
  type: 'heading';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: (TextNode | LinkNode)[];
}

export interface ListBlock {
  type: 'list';
  format: 'ordered' | 'unordered';
  children: ListItemNode[];
}

export interface QuoteBlock {
  type: 'quote';
  children: (TextNode | LinkNode)[];
}

export interface CodeBlock {
  type: 'code';
  children: TextNode[];
}

export interface ImageBlock {
  type: 'image';
  image: {
    url: string;
    alternativeText?: string;
    width?: number;
    height?: number;
  };
  children: TextNode[];
}

export type BlockNode =
  | ParagraphBlock
  | HeadingBlock
  | ListBlock
  | QuoteBlock
  | CodeBlock
  | ImageBlock;

export type BlocksContent = BlockNode[];

// -----------------------------------------------------------------------------
// Answer Option
// -----------------------------------------------------------------------------

export interface AnswerOption {
  id: string;       // "A", "B", "C", "D", "E"
  content: string;  // Answer text (plain text or HTML)
}

// -----------------------------------------------------------------------------
// Question Topic
// -----------------------------------------------------------------------------

export interface QuestionTopic {
  id: number;
  documentId: string;
  name: string;
  description?: BlocksContent;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

// Simplified topic for list/selection
export interface QuestionTopicSummary {
  id: number;
  documentId: string;
  name: string;
}

// -----------------------------------------------------------------------------
// Question Tag
// -----------------------------------------------------------------------------

export interface QuestionTag {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

// Simplified tag for list/selection
export interface QuestionTagSummary {
  id: number;
  documentId: string;
  name: string;
  slug: string;
}

// -----------------------------------------------------------------------------
// Question
// -----------------------------------------------------------------------------

export interface Question {
  id: number;
  documentId: string;

  // Core fields
  code: string | null;                // Unique identifier (e.g., "EC2-001")
  question: BlocksContent;            // Question text (rich text blocks)
  type: QuestionType;                 // single, multiple, essay

  // Answers
  answers: AnswerOption[];            // Array of answer options
  correctAnswer: string[];            // Array of correct answer IDs (e.g., ["A", "C"])

  // Additional content
  explanation?: BlocksContent;        // Explanation (rich text blocks)

  // Metadata
  difficulty: Difficulty;             // easy, medium, hard
  source?: string;                    // Source of the question
  version: number;                    // Version number (default: 1)

  // Relations
  question_topic?: QuestionTopicSummary | null;
  question_tags?: QuestionTagSummary[];

  // Timestamps
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

// -----------------------------------------------------------------------------
// API Response Types (for frontend)
// -----------------------------------------------------------------------------

// Question list item (lighter payload for lists)
export interface QuestionListItem {
  id: number;
  documentId: string;
  code: string | null;
  question: BlocksContent;
  type: QuestionType;
  difficulty: Difficulty;
  question_topic?: QuestionTopicSummary | null;
  question_tags?: QuestionTagSummary[];
  publishedAt: string | null;
}

// Question detail (full payload)
export interface QuestionDetail extends Question {}

// API pagination meta
export interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

// Generic API response
export interface ApiResponse<T> {
  data: T;
  meta?: {
    pagination?: PaginationMeta;
  };
}

// Question list response
export type QuestionListResponse = ApiResponse<QuestionListItem[]>;

// Question detail response
export type QuestionDetailResponse = ApiResponse<QuestionDetail>;

// -----------------------------------------------------------------------------
// Form/Input Types (for creating/updating)
// -----------------------------------------------------------------------------

export interface QuestionInput {
  code?: string;
  question: string | BlocksContent;   // Can accept string (auto-converted) or blocks
  type: QuestionType;
  answers: AnswerOption[];
  correctAnswer: string[];
  explanation?: string | BlocksContent;
  difficulty: Difficulty;
  source?: string;
  version?: number;
  question_topic?: string;            // documentId of topic
  question_tags?: string[];           // documentIds of tags
}

export interface QuestionTopicInput {
  name: string;
  description?: string | BlocksContent;
}

export interface QuestionTagInput {
  name: string;
  slug?: string;                      // Auto-generated if not provided
}

// -----------------------------------------------------------------------------
// Utility Types
// -----------------------------------------------------------------------------

// Helper to extract plain text from blocks content
export type ExtractTextFromBlocks = (blocks: BlocksContent) => string;

// Quiz/Exam session types (for frontend quiz functionality)
export interface QuizQuestion {
  id: number;
  documentId: string;
  code: string | null;
  question: BlocksContent;
  type: QuestionType;
  difficulty: Difficulty;
  answers: AnswerOption[];
  // Note: correctAnswer is NOT included to prevent cheating
}

export interface QuizAnswer {
  questionId: string;                 // documentId of question
  selectedAnswers: string[];          // Array of selected answer IDs
  timeSpent?: number;                 // Time spent in seconds
}

export interface QuizResult {
  questionId: string;
  selectedAnswers: string[];
  correctAnswer: string[];
  isCorrect: boolean;
  explanation?: BlocksContent;
}
