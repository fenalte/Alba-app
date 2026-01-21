export interface ExampleSentence {
  japanese: string;
  english: string;
  romaji: string;
  audio?: string; // Base64 encoded audio
}

export interface VocabularyData {
  kanji: string;
  kana: string; // Hiragana or Katakana
  romaji: string;
  english: string[];
  sentences: ExampleSentence[];
  tenses?: {
    present: ExampleSentence;
    past: ExampleSentence;
    future: ExampleSentence;
  };
}

export interface SavedCard extends VocabularyData {
  id: string;
  timestamp: number;
  tags?: string[]; // Made optional as feature is deprecated
  isFavorite?: boolean;
}

export type ViewState = 'search' | 'collection' | 'game';