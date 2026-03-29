/**
 * @brief i18n label types
 * @description Type definitions for translation keys
 */

import type { CommonLabelKey } from './labels/common';
import type { QuizLabelKey } from './labels/quiz';
import type { SettingsLabelKey } from './labels/settings';
import type { ChallengeLabelKey } from './labels/challenge';
import type { SpriteLabelKey } from './labels/sprites';

/** All available language codes */
export type LanguageCode =
    | 'en'
    | 'fr'
    | 'de'
    | 'es'
    | 'it'
    | 'ja-hrkt'
    | 'ja'
    | 'ko'
    | 'zh-hans'
    | 'zh-hant';

/** Union of all label keys across all categories */
export type LabelKey =
    | CommonLabelKey
    | QuizLabelKey
    | SettingsLabelKey
    | ChallengeLabelKey
    | SpriteLabelKey;
