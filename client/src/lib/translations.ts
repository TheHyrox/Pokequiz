/**
 * @brief Translations module (backward compatibility wrapper)
 * @description Re-exports from the new i18n module structure
 * @deprecated Import from './i18n' instead for new code
 */

// Re-export everything from the new i18n module
export {
    getLabel,
    getAllLabels,
    isLanguageSupported,
    LANGUAGES,
    LANGUAGE_ID_TO_CODE,
    LANGUAGE_CODE_TO_ID
} from './i18n';

export type {
    Language,
    LabelKey,
    LanguageCode
} from './i18n';

// Legacy LABELS export for any direct access
// This is kept for backward compatibility but new code should use getLabel()
import { COMMON_LABELS } from './i18n/labels/common';
import { QUIZ_LABELS } from './i18n/labels/quiz';
import { SETTINGS_LABELS } from './i18n/labels/settings';
import { CHALLENGE_LABELS } from './i18n/labels/challenge';
import { SPRITES_LABELS } from './i18n/labels/sprites';

/**
 * @deprecated Use getLabel() function instead
 */
export const LABELS = {
    en: { ...COMMON_LABELS.en, ...QUIZ_LABELS.en, ...SETTINGS_LABELS.en, ...CHALLENGE_LABELS.en, ...SPRITES_LABELS.en },
    fr: { ...COMMON_LABELS.fr, ...QUIZ_LABELS.fr, ...SETTINGS_LABELS.fr, ...CHALLENGE_LABELS.fr, ...SPRITES_LABELS.fr },
    de: { ...COMMON_LABELS.de, ...QUIZ_LABELS.de, ...SETTINGS_LABELS.de, ...CHALLENGE_LABELS.de, ...SPRITES_LABELS.de },
    es: { ...COMMON_LABELS.es, ...QUIZ_LABELS.es, ...SETTINGS_LABELS.es, ...CHALLENGE_LABELS.es, ...SPRITES_LABELS.es },
    it: { ...COMMON_LABELS.it, ...QUIZ_LABELS.it, ...SETTINGS_LABELS.it, ...CHALLENGE_LABELS.it, ...SPRITES_LABELS.it },
    'ja-hrkt': { ...COMMON_LABELS['ja-hrkt'], ...QUIZ_LABELS['ja-hrkt'], ...SETTINGS_LABELS['ja-hrkt'], ...CHALLENGE_LABELS['ja-hrkt'], ...SPRITES_LABELS['ja-hrkt'] },
    ja: { ...COMMON_LABELS.ja, ...QUIZ_LABELS.ja, ...SETTINGS_LABELS.ja, ...CHALLENGE_LABELS.ja, ...SPRITES_LABELS.ja },
    ko: { ...COMMON_LABELS.ko, ...QUIZ_LABELS.ko, ...SETTINGS_LABELS.ko, ...CHALLENGE_LABELS.ko, ...SPRITES_LABELS.ko },
    'zh-hans': { ...COMMON_LABELS['zh-hans'], ...QUIZ_LABELS['zh-hans'], ...SETTINGS_LABELS['zh-hans'], ...CHALLENGE_LABELS['zh-hans'], ...SPRITES_LABELS['zh-hans'] },
    'zh-hant': { ...COMMON_LABELS['zh-hant'], ...QUIZ_LABELS['zh-hant'], ...SETTINGS_LABELS['zh-hant'], ...CHALLENGE_LABELS['zh-hant'], ...SPRITES_LABELS['zh-hant'] }
} as const;
