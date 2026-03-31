/**
 * @brief Local storage utility for persisting app state
 * @description Handles caching of language settings and quiz options
 */

import type { DescriptionQuizSettings, SpriteQuizSettings, InformationQuizSettings } from '../../../shared/types';

const LANGUAGE_KEY = 'pokequiz_language';
const DESCRIPTION_SETTINGS_KEY = 'pokequiz_description_settings';
const SPRITE_SETTINGS_KEY = 'pokequiz_sprite_settings';
const INFORMATION_SETTINGS_KEY = 'pokequiz_information_settings';

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
