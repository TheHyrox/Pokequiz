/**
 * @brief Shared constants for the Pokequiz application
 * @description Single source of truth for languages, generations, and configuration
 */

import type { Language, GenerationRange } from '../types';

/**
 * @brief Supported languages with PokeAPI IDs
 * @description Single source of truth for all language mappings
 */
export const LANGUAGES: Language[] = [
    { id: 9, code: 'en', name: 'English', nativeName: '🇬🇧 English' },
    { id: 5, code: 'fr', name: 'French', nativeName: '🇫🇷 Français' },
    { id: 6, code: 'de', name: 'German', nativeName: '🇩🇪 Deutsch' },
    { id: 7, code: 'es', name: 'Spanish', nativeName: '🇪🇸 Español' },
    { id: 8, code: 'it', name: 'Italian', nativeName: '🇮🇹 Italiano' },
    { id: 11, code: 'ja', name: 'Japanese', nativeName: '🇯🇵 日本語' },
    { id: 1, code: 'ja-hrkt', name: 'Japanese (Hiragana)', nativeName: '🇯🇵 ひらがな' },
    { id: 4, code: 'zh-hant', name: 'Chinese (Traditional)', nativeName: '繁體中文' },
    { id: 12, code: 'zh-hans', name: 'Chinese (Simplified)', nativeName: '简体中文' },
    { id: 3, code: 'ko', name: 'Korean', nativeName: '🇰🇷 한국어' }
];

/**
 * @brief Map from language ID to language code
 * @description Derived from LANGUAGES for quick lookups
 * @example LANGUAGE_ID_TO_CODE[9] // returns 'en'
 */
export const LANGUAGE_ID_TO_CODE: Record<number, string> = Object.fromEntries(
    LANGUAGES.map(lang => [lang.id, lang.code])
);

/**
 * @brief Map from language code to language ID
 * @example LANGUAGE_CODE_TO_ID['en'] // returns 9
 */
export const LANGUAGE_CODE_TO_ID: Record<string, number> = Object.fromEntries(
    LANGUAGES.map(lang => [lang.code, lang.id])
);

/**
 * @brief Pokemon ID ranges by generation
 * @description Defines the min/max Pokemon IDs for each generation
 */
export const GENERATION_RANGES: Record<number, GenerationRange> = {
    1: { min: 1, max: 151 },
    2: { min: 152, max: 251 },
    3: { min: 252, max: 386 },
    4: { min: 387, max: 493 },
    5: { min: 494, max: 649 },
    6: { min: 650, max: 721 },
    7: { min: 722, max: 809 },
    8: { min: 810, max: 905 },
    9: { min: 906, max: 1025 }
};

/**
 * @brief All available generation numbers
 */
export const ALL_GENERATIONS: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * @brief Total number of Pokemon in the National Pokedex
 */
export const TOTAL_POKEMON = 1025;

/**
 * @brief Generation display labels for UI
 */
export const GENERATION_LABELS: { id: number; label: string }[] = ALL_GENERATIONS.map(id => ({
    id,
    label: `Gen ${id}`
}));

/**
 * @brief Placeholder text for hiding Pokemon names by language ID
 * @description Used in description spoiler prevention
 */
export const POKEMON_NAME_PLACEHOLDERS: Record<string, string> = {
    '1': 'このポケモン',
    '3': '이 포켓몬',
    '4': '這隻寶可夢',
    '5': 'ce Pokémon',
    '6': 'dieses Pokémon',
    '7': 'este Pokémon',
    '8': 'questo Pokémon',
    '9': 'this Pokemon',
    '11': 'このポケモン',
    '12': '这只宝可梦'
};

/**
 * @brief PokeAPI version group IDs by generation
 * @description Maps generation number to array of game version IDs
 */
export const GENERATION_VERSION_IDS: Record<string, number[]> = {
    '1': [32, 31, 46, 45, 44, 3, 2, 1],
    '2': [6, 5, 4],
    '3': [11, 10, 9, 8, 7],
    '4': [39, 38, 37, 16, 15, 14, 13, 12],
    '5': [22, 21, 18, 17],
    '6': [26, 25, 24, 23],
    '7': [30, 29, 28, 27],
    '8': [36, 35, 34, 33],
    '9': [43, 42, 41, 40]
};

/**
 * @brief Default number of questions in challenge/hardcore modes
 */
export const CHALLENGE_QUESTION_COUNT = 10;

/**
 * @brief Default quiz settings
 */
export const DEFAULT_QUIZ_SETTINGS = {
    hasTimeLimit: false,
    timeLimit: 15,
    gameMode: 'score' as const,
    changeDescription: false,
    selectedGenerations: [...ALL_GENERATIONS],
    truncateStrength: 0,
    enableScramble: false
};
