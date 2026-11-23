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
import { getAllLabels } from './i18n';
import type { LanguageCode } from './i18n';

const SUPPORTED_LANGS: LanguageCode[] = [
    'en', 'fr', 'de', 'es', 'it', 'ja-hrkt', 'ja', 'ko', 'zh-hans', 'zh-hant'
];

/**
 * @deprecated Use getLabel() function instead
 */
export const LABELS: Record<LanguageCode, Record<string, string>> = Object.fromEntries(
    SUPPORTED_LANGS.map(lang => [lang, getAllLabels(lang)])
) as Record<LanguageCode, Record<string, string>>;
