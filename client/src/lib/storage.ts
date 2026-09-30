/**
 * @brief Local storage utility for persisting app state
 * @description Handles caching of language settings and quiz options
 */

import type { DescriptionQuizSettings, SpriteQuizSettings, InformationQuizSettings, PokedleQuizSettings, NumberQuizSettings } from '../../../shared/types';

const LANGUAGE_KEY = 'pokequiz_language';
const DESCRIPTION_SETTINGS_KEY = 'pokequiz_description_settings';
const SPRITE_SETTINGS_KEY = 'pokequiz_sprite_settings';
const INFORMATION_SETTINGS_KEY = 'pokequiz_information_settings';
const POKEDLE_SETTINGS_KEY = 'pokequiz_pokedle_settings';
const NUMBER_SETTINGS_KEY = 'pokequiz_number_settings';

/**
 * @brief Get cached language ID
 */
export function getCachedLanguageId(): number | null {
    if (typeof window === 'undefined') return null;
    const cached = localStorage.getItem(LANGUAGE_KEY);
    return cached ? parseInt(cached) : null;
}

/**
 * @brief Save language ID to local storage
 */
export function saveLanguageId(languageId: number): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LANGUAGE_KEY, languageId.toString());
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
