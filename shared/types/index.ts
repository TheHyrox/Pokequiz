/**
 * @brief Shared type definitions for the Pokequiz application
 * @description Centralized TypeScript interfaces and types used across client and server
 */

/**
 * @brief Language configuration for internationalization
 * @description Maps PokeAPI language IDs to ISO codes and display names
 */
export interface Language {
    /** PokeAPI language ID (e.g., 9 for English) */
    id: number;
    /** ISO 639-1 language code (e.g., 'en', 'fr') */
    code: string;
    /** English name of the language */
    name: string;
    /** Native name with flag emoji */
    nativeName: string;
}

/**
 * @brief Pokemon data for display and selection
 * @description Basic Pokemon information used in lists and cards
 */
export interface Pokemon {
    /** National Pokedex ID */
    id: number;
    /** Localized Pokemon name */
    name: string;
}

/**
 * @brief Pokemon option in quiz selection
 * @description Extended Pokemon data with correctness flag for quiz answers
 */
export interface PokemonOption extends Pokemon {
    /** Whether this option is the correct answer */
    isCorrect: boolean;
}

/**
 * @brief Available game mode types
 * @description Controls quiz behavior and scoring mechanics
 */
export type GameMode = 'score' | 'infinite' | 'challenge' | 'hardcore';

/**
 * @brief Quiz game settings configuration
 * @description All customizable options for a quiz session
 */
export interface QuizSettings {
    /** Whether time limit is enabled */
    hasTimeLimit: boolean;
    /** Time limit per question in seconds */
    timeLimit: number;
    /** Selected game mode */
    gameMode: GameMode;
    /** Allow viewing alternate descriptions */
    changeDescription: boolean;
    /** Array of selected generation numbers (1-9) */
    selectedGenerations: number[];
    /** Word truncation strength (0-3) */
    truncateStrength: number;
    /** Enable word scrambling */
    enableScramble: boolean;
}

/**
 * @brief Challenge mode question record
 * @description Stores question data for end-of-quiz review
 */
export interface ChallengeQuestion {
    /** Question number (1-10) */
    questionNumber: number;
    /** The description shown to the user */
    description: string;
    /** Correct Pokemon name */
    correctPokemonName: string;
    /** Correct Pokemon ID */
    correctPokemonId: number;
    /** ID of user's selected Pokemon */
    userAnswerId: number;
    /** Name of user's selected Pokemon */
    userAnswerName: string;
    /** All available options for this question */
    allOptions: PokemonOption[];
    /** Whether the user answered correctly */
    isCorrect: boolean;
}

/**
 * @brief Toast notification type
 */
export type ToastType = 'error' | 'success' | 'info';

/**
 * @brief Toast notification state
 * @description Controls toast visibility and content
 */
export interface ToastState {
    /** Message to display */
    message: string;
    /** Toast appearance type */
    type: ToastType;
    /** Whether toast is visible */
    show: boolean;
}

/**
 * @brief Generation ID range definition
 * @description Maps generation number to Pokemon ID range
 */
export interface GenerationRange {
    /** First Pokemon ID in generation */
    min: number;
    /** Last Pokemon ID in generation */
    max: number;
}
