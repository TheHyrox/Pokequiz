/**
 * @brief Shared constants for the Pokequiz application
 * @description Single source of truth for languages, generations, and configuration
 */

import type { Language, GenerationRange, SpriteEffectSettings, SpriteQuizSettings, HardcoreModeState } from '../types';

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
    enableScramble: false,
    numberOfOptions: 4
};

// ============================================================
// SPRITES QUIZ CONSTANTS
// ============================================================

/**
 * @brief Default sprite effect settings
 */
export const DEFAULT_SPRITE_EFFECTS: SpriteEffectSettings = {
    blurEnabled: true,
    blurStrength: 5,
    pixelateEnabled: false,
    pixelateStrength: 10,
    silhouetteEnabled: false,
    rotationEnabled: false
};

/**
 * @brief Default sprites quiz settings
 */
export const DEFAULT_SPRITE_QUIZ_SETTINGS: SpriteQuizSettings = {
    hasTimeLimit: false,
    timeLimit: 15,
    gameMode: 'score',
    selectedGenerations: [...ALL_GENERATIONS],
    selectedSpriteTypes: ['front'],
    spriteSource: 'home',
    effects: { ...DEFAULT_SPRITE_EFFECTS },
    numberOfOptions: 4
};

// ============================================================
// INFORMATION QUIZ CONSTANTS
// ============================================================

/**
 * @brief All available information types
 */
export const ALL_INFORMATION_TYPES: import('../types').InformationType[] = [
    'weight',
    'height',
    'abilities',
    'eggGroup',
    'generation',
    'shape',
    'color',
    'types',
    'category',
    'habitat'
];

/**
 * @brief Default information values (first 3 selected)
 */
export const DEFAULT_INFORMATION_TYPES: import('../types').InformationType[] = [
    'types',
    'generation',
    'abilities'
];

/**
 * @brief Default information quiz settings
 */
export const DEFAULT_INFORMATION_QUIZ_SETTINGS: import('../types').InformationQuizSettings = {
    hasTimeLimit: false,
    timeLimit: 30,
    gameMode: 'easy',
    selectedGenerations: [...ALL_GENERATIONS],
    selectedInformations: [...DEFAULT_INFORMATION_TYPES],
    numberOfOptions: 10,
    showSprites: false,
    enableFakeInformation: false,
    fakeInformationRate: 5
};

// ============================================================
// HARDCORE MODE CONSTANTS
// ============================================================

/**
 * @brief Initial state for hardcore mode
 */
export const HARDCORE_INITIAL_STATE: HardcoreModeState = {
    lives: 3,
    consecutiveCorrect: 0
};

/**
 * @brief Maximum lives in hardcore mode
 */
export const HARDCORE_MAX_LIVES = 3;

/**
 * @brief Consecutive correct answers needed to gain a life
 */
export const HARDCORE_LIFE_REWARD_THRESHOLD = 10;

// ============================================================
// POKEDLE QUIZ CONSTANTS
// ============================================================
import type { PokedleColumn, PokedleQuizSettings, NumberQuizSettings } from '../types';

export const ALL_POKEDLE_COLUMNS: PokedleColumn[] = [
    'type1', 'type2', 'weight', 'height', 'color', 
    'abilities', 'eggGroup', 'generation', 'shape', 
    'category', 'habitat'
];

export const DEFAULT_POKEDLE_QUIZ_SETTINGS: PokedleQuizSettings = {
    guessLimit: 8,
    selectedGenerations: ALL_GENERATIONS,
    selectedColumns: ALL_POKEDLE_COLUMNS,
    showMoreLessIndicators: true
};

// ============================================================
// NUMBER QUIZ CONSTANTS
// ============================================================
export const DEFAULT_NUMBER_QUIZ_SETTINGS: NumberQuizSettings = {
    subMode: 'normal',
    hasGuessLimit: true,
    guessLimit: 8,
    selectedGenerations: [...ALL_GENERATIONS],
    showHigherLower: true,
    blurEnabled: false,
    blurStrength: 5,
    pixelateEnabled: false,
    pixelateStrength: 8,
    silhouetteEnabled: false,
    rotationEnabled: false
};

// ============================================================
// ZOOMED / CROPPED SPRITE QUIZ CONSTANTS
// ============================================================
import type { ZoomQuizSettings, ShinyQuizSettings } from '../types';

export const DEFAULT_ZOOM_QUIZ_SETTINGS: ZoomQuizSettings = {
    hasTimeLimit: false,
    timeLimit: 20,
    gameMode: 'score',
    selectedGenerations: [...ALL_GENERATIONS],
    spriteSource: 'official',
    initialCropSize: 30,
    zoomStep: 15,
    allowManualHints: true,
    numberOfOptions: 4
};

// ============================================================
// SHINY VS. NORMAL QUIZ CONSTANTS
// ============================================================
export const DEFAULT_SHINY_QUIZ_SETTINGS: ShinyQuizSettings = {
    variant: 'binary',
    gameMode: 'score',
    hasTimeLimit: false,
    timeLimit: 15,
    selectedGenerations: [...ALL_GENERATIONS],
    spriteSource: 'default',
    numberOfFakes: 4,
    showPokemonName: true,
    showNormalReference: true
};

// ============================================================
// SUDOKU (POKEGRID) QUIZ CONSTANTS
// ============================================================
import type { SudokuRestrictionCategory, SudokuRestriction, SudokuQuizSettings } from '../types';

export const ALL_SUDOKU_RESTRICTION_CATEGORIES: SudokuRestrictionCategory[] = [
    'region',
    'type',
    'evolution',
    'dualType',
    'monotype',
    'baby',
    'starter',
    'fossil',
    'legendary',
    'mythical',
    'ultraBeast',
    'paradox',
    'mega',
    'primal',
    'gigantamax'
];

/**
 * @brief Canonical list of all 42 individual Sudoku restrictions grouped by category
 */
export const ALL_SUDOKU_RESTRICTIONS: SudokuRestriction[] = [
    // Regions (10)
    { id: 'region:kanto',  category: 'region', value: 'kanto',  labelKey: 'sudoku_region_kanto' },
    { id: 'region:johto',  category: 'region', value: 'johto',  labelKey: 'sudoku_region_johto' },
    { id: 'region:hoenn',  category: 'region', value: 'hoenn',  labelKey: 'sudoku_region_hoenn' },
    { id: 'region:sinnoh', category: 'region', value: 'sinnoh', labelKey: 'sudoku_region_sinnoh' },
    { id: 'region:unova',  category: 'region', value: 'unova',  labelKey: 'sudoku_region_unova' },
    { id: 'region:kalos',  category: 'region', value: 'kalos',  labelKey: 'sudoku_region_kalos' },
    { id: 'region:alola',  category: 'region', value: 'alola',  labelKey: 'sudoku_region_alola' },
    { id: 'region:galar',  category: 'region', value: 'galar',  labelKey: 'sudoku_region_galar' },
    { id: 'region:hisui',  category: 'region', value: 'hisui',  labelKey: 'sudoku_region_hisui' },
    { id: 'region:paldea', category: 'region', value: 'paldea', labelKey: 'sudoku_region_paldea' },
    // Types (18)
    { id: 'type:1',  category: 'type', value: '1',  labelKey: 'sudoku_type_normal' },
    { id: 'type:10', category: 'type', value: '10', labelKey: 'sudoku_type_fire' },
    { id: 'type:11', category: 'type', value: '11', labelKey: 'sudoku_type_water' },
    { id: 'type:13', category: 'type', value: '13', labelKey: 'sudoku_type_electric' },
    { id: 'type:12', category: 'type', value: '12', labelKey: 'sudoku_type_grass' },
    { id: 'type:15', category: 'type', value: '15', labelKey: 'sudoku_type_ice' },
    { id: 'type:2',  category: 'type', value: '2',  labelKey: 'sudoku_type_fighting' },
    { id: 'type:4',  category: 'type', value: '4',  labelKey: 'sudoku_type_poison' },
    { id: 'type:5',  category: 'type', value: '5',  labelKey: 'sudoku_type_ground' },
    { id: 'type:3',  category: 'type', value: '3',  labelKey: 'sudoku_type_flying' },
    { id: 'type:14', category: 'type', value: '14', labelKey: 'sudoku_type_psychic' },
    { id: 'type:7',  category: 'type', value: '7',  labelKey: 'sudoku_type_bug' },
    { id: 'type:6',  category: 'type', value: '6',  labelKey: 'sudoku_type_rock' },
    { id: 'type:8',  category: 'type', value: '8',  labelKey: 'sudoku_type_ghost' },
    { id: 'type:16', category: 'type', value: '16', labelKey: 'sudoku_type_dragon' },
    { id: 'type:17', category: 'type', value: '17', labelKey: 'sudoku_type_dark' },
    { id: 'type:9',  category: 'type', value: '9',  labelKey: 'sudoku_type_steel' },
    { id: 'type:18', category: 'type', value: '18', labelKey: 'sudoku_type_fairy' },
    // Evolutions (7)
    { id: 'evolution:basic',      category: 'evolution', value: 'basic',      labelKey: 'sudoku_evo_basic' },
    { id: 'evolution:stage1',     category: 'evolution', value: 'stage1',     labelKey: 'sudoku_evo_stage1' },
    { id: 'evolution:stage2',     category: 'evolution', value: 'stage2',     labelKey: 'sudoku_evo_stage2' },
    { id: 'evolution:friendship', category: 'evolution', value: 'friendship', labelKey: 'sudoku_evo_friendship' },
    { id: 'evolution:trade',      category: 'evolution', value: 'trade',      labelKey: 'sudoku_evo_trade' },
    { id: 'evolution:item',       category: 'evolution', value: 'item',       labelKey: 'sudoku_evo_item' },
    { id: 'evolution:levelup',    category: 'evolution', value: 'levelup',    labelKey: 'sudoku_evo_levelup' },
    // Special Traits (12)
    { id: 'dualType',   category: 'dualType',   value: 'dualType',   labelKey: 'sudoku_cat_dualType' },
    { id: 'monotype',   category: 'monotype',   value: 'monotype',   labelKey: 'sudoku_cat_monotype' },
    { id: 'baby',       category: 'baby',       value: 'baby',       labelKey: 'sudoku_cat_baby' },
    { id: 'starter',    category: 'starter',    value: 'starter',    labelKey: 'sudoku_cat_starter' },
    { id: 'fossil',     category: 'fossil',     value: 'fossil',     labelKey: 'sudoku_cat_fossil' },
    { id: 'legendary',  category: 'legendary',  value: 'legendary',  labelKey: 'sudoku_cat_legendary' },
    { id: 'mythical',   category: 'mythical',   value: 'mythical',   labelKey: 'sudoku_cat_mythical' },
    { id: 'ultraBeast', category: 'ultraBeast', value: 'ultraBeast', labelKey: 'sudoku_cat_ultraBeast' },
    { id: 'paradox',    category: 'paradox',    value: 'paradox',    labelKey: 'sudoku_cat_paradox' },
    { id: 'mega',       category: 'mega',       value: 'mega',       labelKey: 'sudoku_cat_mega' },
    { id: 'primal',     category: 'primal',     value: 'primal',     labelKey: 'sudoku_cat_primal' },
    { id: 'gigantamax', category: 'gigantamax', value: 'gigantamax', labelKey: 'sudoku_cat_gigantamax' }
];

export const ALL_SUDOKU_RESTRICTION_IDS: string[] = ALL_SUDOKU_RESTRICTIONS.map(r => r.id);

export const DEFAULT_SUDOKU_QUIZ_SETTINGS: SudokuQuizSettings = {
    gameMode: 'normal',
    gridSize: 3,
    unlimitedGuesses: false,
    guessLimit: 10,
    hasTimeLimit: false,
    timeLimit: 180,
    softLockGuard: true,
    uniquePokemonOnly: true,
    allowedCategories: [...ALL_SUDOKU_RESTRICTION_CATEGORIES],
    allowedRestrictions: [...ALL_SUDOKU_RESTRICTION_IDS]
};



