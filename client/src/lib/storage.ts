/**
 * @brief Local storage utility for persisting app state
 * @description Handles caching of language settings and quiz options
 */

import type {
    DescriptionQuizSettings,
    SpriteQuizSettings,
    InformationQuizSettings,
    PokedleQuizSettings,
    NumberQuizSettings,
    PersonalStatsStore,
    QuizModeStatEntry,
    DailyChallengeRecord
} from '../../../shared/types';
import { getTodayDateString } from '../../../shared/utils/seededRng';

const LANGUAGE_KEY = 'pokequiz_language';
const LEGACY_LANGUAGE_KEY = 'selectedLanguageId';
const DARK_MODE_KEY = 'pokequiz_dark_mode';
const DESCRIPTION_SETTINGS_KEY = 'pokequiz_description_settings';
const SPRITE_SETTINGS_KEY = 'pokequiz_sprite_settings';
const INFORMATION_SETTINGS_KEY = 'pokequiz_information_settings';
const POKEDLE_SETTINGS_KEY = 'pokequiz_pokedle_settings';
const NUMBER_SETTINGS_KEY = 'pokequiz_number_settings';
const PERSONAL_STATS_KEY = 'pokequiz_personal_stats';

/**
 * @brief Get cached language ID
 */
export function getCachedLanguageId(): number | null {
    if (typeof window === 'undefined') return null;
    const cached = localStorage.getItem(LANGUAGE_KEY) ?? localStorage.getItem(LEGACY_LANGUAGE_KEY);
    if (!cached) return null;
    const parsed = parseInt(cached, 10);
    return isNaN(parsed) ? null : parsed;
}

/**
 * @brief Save language ID to local storage
 */
export function saveLanguageId(languageId: number): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LANGUAGE_KEY, languageId.toString());
    localStorage.removeItem(LEGACY_LANGUAGE_KEY);
}

/**
 * @brief Get cached dark mode state
 */
export function getCachedDarkMode(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(DARK_MODE_KEY) === 'true';
}

/**
 * @brief Save dark mode state to local storage
 */
export function saveDarkMode(isDark: boolean): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(DARK_MODE_KEY, isDark ? 'true' : 'false');
}

/**
 * @brief Get cached description quiz settings
 */
export function getCachedDescriptionSettings(): DescriptionQuizSettings | null {
    if (typeof window === 'undefined') return null;
    const cached = localStorage.getItem(DESCRIPTION_SETTINGS_KEY);
    try {
        return cached ? JSON.parse(cached) : null;
    } catch {
        return null;
    }
}

/**
 * @brief Save description quiz settings to local storage
 */
export function saveDescriptionSettings(settings: DescriptionQuizSettings): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(DESCRIPTION_SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * @brief Get cached sprite quiz settings
 */
export function getCachedSpriteSettings(): SpriteQuizSettings | null {
    if (typeof window === 'undefined') return null;
    const cached = localStorage.getItem(SPRITE_SETTINGS_KEY);
    try {
        return cached ? JSON.parse(cached) : null;
    } catch {
        return null;
    }
}

/**
 * @brief Save sprite quiz settings to local storage
 */
export function saveSpriteSettings(settings: SpriteQuizSettings): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SPRITE_SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * @brief Get cached information quiz settings
 */
export function getCachedInformationSettings(): InformationQuizSettings | null {
    if (typeof window === 'undefined') return null;
    const cached = localStorage.getItem(INFORMATION_SETTINGS_KEY);
    try {
        return cached ? JSON.parse(cached) : null;
    } catch {
        return null;
    }
}

/**
 * @brief Save information quiz settings to local storage
 */
export function saveInformationSettings(settings: InformationQuizSettings): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(INFORMATION_SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * @brief Get cached pokedle quiz settings
 */
export function getCachedPokedleSettings(): PokedleQuizSettings | null {
    if (typeof window === 'undefined') return null;
    const cached = localStorage.getItem(POKEDLE_SETTINGS_KEY);
    try {
        return cached ? JSON.parse(cached) : null;
    } catch {
        return null;
    }
}

/**
 * @brief Save pokedle quiz settings to local storage
 */
export function savePokedleSettings(settings: PokedleQuizSettings): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(POKEDLE_SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * @brief Get cached number quiz settings
 */
export function getCachedNumberSettings(): NumberQuizSettings | null {
    if (typeof window === 'undefined') return null;
    const cached = localStorage.getItem(NUMBER_SETTINGS_KEY);
    try {
        return cached ? JSON.parse(cached) : null;
    } catch {
        return null;
    }
}

/**
 * @brief Save number quiz settings to local storage
 */
export function saveNumberSettings(settings: NumberQuizSettings): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(NUMBER_SETTINGS_KEY, JSON.stringify(settings));
}

// ============================================================
// PERSONAL STATS & STREAKS (LOCAL STORAGE)
// ============================================================

function createEmptyStatEntry(): QuizModeStatEntry {
    return {
        totalGamesPlayed: 0,
        totalWins: 0,
        bestScore: null,
        currentStreak: 0,
        longestStreak: 0,
        totalGuessesInWins: 0
    };
}

/**
 * @brief Get personal stats store from localStorage
 */
export function getPersonalStats(): PersonalStatsStore {
    if (typeof window === 'undefined') {
        return { modes: {}, dailyChallenges: {} };
    }
    const raw = localStorage.getItem(PERSONAL_STATS_KEY);
    if (!raw) {
        return { modes: {}, dailyChallenges: {} };
    }
    try {
        const parsed = JSON.parse(raw);
        return {
            modes: parsed?.modes && typeof parsed.modes === 'object' ? parsed.modes : {},
            dailyChallenges: parsed?.dailyChallenges && typeof parsed.dailyChallenges === 'object' ? parsed.dailyChallenges : {}
        };
    } catch {
        return { modes: {}, dailyChallenges: {} };
    }
}

/**
 * @brief Save personal stats store to localStorage
 */
export function savePersonalStats(store: PersonalStatsStore): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(PERSONAL_STATS_KEY, JSON.stringify(store));
}

/**
 * @brief Reset all personal stats and streaks in localStorage
 */
export function resetPersonalStats(): PersonalStatsStore {
    const empty: PersonalStatsStore = { modes: {}, dailyChallenges: {} };
    if (typeof window !== 'undefined') {
        localStorage.removeItem(PERSONAL_STATS_KEY);
    }
    return empty;
}

/**
 * @brief Get stats for a specific quiz and mode
 */
export function getModeStats(quizSlug: string, modeKey: string): QuizModeStatEntry {
    const store = getPersonalStats();
    const key = `${quizSlug}:${modeKey}`;
    return store.modes[key] ? { ...createEmptyStatEntry(), ...store.modes[key] } : createEmptyStatEntry();
}

export interface RecordGameResultOptions {
    quizSlug: 'description' | 'information' | 'sprites' | 'pokedle' | 'number';
    modeKey: string;
    isWin: boolean;
    score: number;
    /** Number of guesses used (for pokedle and number:normal) */
    guessesUsed?: number;
    /** In modes like infinite/hardcore, the streak achieved in this single run */
    runStreak?: number;
    /** Whether lower score/guesses is better (true for Pokedle & Number Normal) */
    lowerIsBetter?: boolean;
    /** Optional daily challenge info */
    dailyChallenge?: {
        date?: string;
        pokemonId?: number;
    };
}

/**
 * @brief Record a completed quiz game into client-side personal stats
 */
export function recordQuizGameResult(opts: RecordGameResultOptions): QuizModeStatEntry {
    const store = getPersonalStats();
    const key = `${opts.quizSlug}:${opts.modeKey}`;
    const entry: QuizModeStatEntry = store.modes[key]
        ? { ...createEmptyStatEntry(), ...store.modes[key] }
        : createEmptyStatEntry();

    entry.totalGamesPlayed += 1;
    if (opts.isWin) {
        entry.totalWins += 1;
        entry.currentStreak += 1;
        if (typeof opts.guessesUsed === 'number' && opts.guessesUsed > 0) {
            entry.totalGuessesInWins = (entry.totalGuessesInWins ?? 0) + opts.guessesUsed;
        }
    } else {
        entry.currentStreak = 0;
    }

    // Update longest streak (considering both consecutive game wins and single-run streaks)
    const candidateStreak = Math.max(entry.currentStreak, opts.runStreak ?? 0);
    if (candidateStreak > entry.longestStreak) {
        entry.longestStreak = candidateStreak;
    }

    // Update best score
    if (opts.lowerIsBetter) {
        // For Pokedle and Number (Normal), only wins count towards fewest guesses bestScore
        if (opts.isWin && opts.score > 0) {
            if (entry.bestScore === null || opts.score < entry.bestScore) {
                entry.bestScore = opts.score;
            }
        }
    } else {
        if (entry.bestScore === null || opts.score > entry.bestScore) {
            entry.bestScore = opts.score;
        }
    }

    entry.lastPlayedAt = new Date().toISOString();
    store.modes[key] = entry;

    // Also record daily challenge completion if applicable
    if (opts.dailyChallenge && (opts.quizSlug === 'pokedle' || opts.quizSlug === 'description' || opts.quizSlug === 'number')) {
        const dateStr = opts.dailyChallenge.date || getTodayDateString();
        const dailyKey = `${opts.quizSlug}:${dateStr}`;
        const existingDaily = store.dailyChallenges[dailyKey];
        const record: DailyChallengeRecord = {
            date: dateStr,
            quiz: opts.quizSlug,
            completed: opts.isWin || (existingDaily?.completed ?? false),
            score: opts.score,
            pokemonId: opts.dailyChallenge.pokemonId
        };
        store.dailyChallenges[dailyKey] = record;
    }

    savePersonalStats(store);
    return entry;
}

/**
 * @brief Get daily challenge record for a quiz and date (defaults to today)
 */
export function getDailyChallengeStatus(
    quizSlug: 'pokedle' | 'description' | 'number',
    dateStr: string = getTodayDateString()
): DailyChallengeRecord | null {
    const store = getPersonalStats();
    return store.dailyChallenges[`${quizSlug}:${dateStr}`] || null;
}

