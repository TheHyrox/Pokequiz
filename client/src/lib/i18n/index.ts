/**
 * @brief Internationalization (i18n) module
 * @description Centralized translation system with type-safe label access
 */

import { COMMON_LABELS } from './labels/common';
import { QUIZ_LABELS } from './labels/quiz';
import { SETTINGS_LABELS } from './labels/settings';
import { CHALLENGE_LABELS } from './labels/challenge';
import { SPRITES_LABELS } from './labels/sprites';
import { INFORMATION_LABELS } from './labels/information';
import type { LabelKey, LanguageCode } from './types';

// Re-export from shared constants
export { LANGUAGES, LANGUAGE_ID_TO_CODE, LANGUAGE_CODE_TO_ID } from '../../../../shared/constants';
export type { Language } from '../../../../shared/types';
export type { LabelKey, LanguageCode } from './types';

/** Supported language codes */
const SUPPORTED_LANGUAGES: LanguageCode[] = [
    'en', 'fr', 'de', 'es', 'it', 'ja-hrkt', 'ja', 'ko', 'zh-hans', 'zh-hant'
];

/**
 * @brief Merged labels object combining all label modules
 */
const LABELS: Record<LanguageCode, Record<string, string>> = SUPPORTED_LANGUAGES.reduce(
    (acc, lang) => {
        acc[lang] = {
            ...COMMON_LABELS[lang],
            ...QUIZ_LABELS[lang],
            ...SETTINGS_LABELS[lang],
            ...CHALLENGE_LABELS[lang],
            ...SPRITES_LABELS[lang],
            ...INFORMATION_LABELS[lang]
        };
        return acc;
    },
    {} as Record<LanguageCode, Record<string, string>>
);

/**
 * @brief Gets a localized label by key
 * @param languageCode - ISO language code (e.g., 'en', 'fr')
 * @param key - Label key to retrieve
 * @returns Localized string, or the key itself if not found
 * @example
 * getLabel('en', 'pokequiz') // returns 'Pokequiz'
 * getLabel('fr', 'back') // returns '← Retour'
 */
export function getLabel(languageCode: string, key: LabelKey): string {
    const lang = LABELS[languageCode as LanguageCode] || LABELS.en;
    return lang[key] || key;
}

/**
 * @brief Checks if a language code is supported
 * @param languageCode - Language code to check
 * @returns True if language is supported
 */
export function isLanguageSupported(languageCode: string): languageCode is LanguageCode {
    return SUPPORTED_LANGUAGES.includes(languageCode as LanguageCode);
}

/**
 * @brief Gets all labels for a specific language
 * @param languageCode - ISO language code
 * @returns Object with all labels for that language
 */
export function getAllLabels(languageCode: string): Record<string, string> {
    return LABELS[languageCode as LanguageCode] || LABELS.en;
}
