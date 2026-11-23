/**
 * @brief Declarative quiz registry
 * @description Single source of truth for registering quiz modes in the application.
 *              Adding a new quiz only requires adding an entry to QUIZ_REGISTRY.
 */

import type { Component } from 'svelte';
import DescriptionQuizSettingsComponent from '../../components/DescriptionQuizSettings.svelte';
import SpriteQuizSettingsComponent from '../../components/SpriteQuizSettings.svelte';
import InformationQuizSettingsComponent from '../../components/InformationQuizSettings.svelte';
import PokedleQuizSettingsComponent from '../../components/PokedleQuizSettings.svelte';
import NumberQuizSettingsComponent from '../../components/NumberQuizSettings.svelte';

import DescriptionQuiz from '../QuizDescription.svelte';
import SpritesQuiz from '../QuizSprites.svelte';
import QuizInformation from '../QuizInformation.svelte';
import QuizPokedle from '../QuizPokedle.svelte';
import QuizNumber from '../QuizNumber.svelte';

import {
    getCachedDescriptionSettings,
    getCachedSpriteSettings,
    getCachedInformationSettings,
    getCachedPokedleSettings,
    getCachedNumberSettings
} from './storage';
import type { LabelKey } from './i18n';

export type QuizId =
    | 'description-quiz'
    | 'information-quiz'
    | 'sprites-quiz'
    | 'pokedle-quiz'
    | 'number-quiz';

export interface QuizRegistryEntry<TSettings = any> {
    id: QuizId;
    slug: string;
    name: string;
    description: string;
    titleKey: LabelKey;
    descriptionKey: LabelKey;
    icon: string;
    SettingsComponent: Component<any>;
    QuizComponent: Component<any>;
    getCachedSettings: () => TSettings | null;
}

export const QUIZ_REGISTRY: QuizRegistryEntry[] = [
    {
        id: 'description-quiz',
        slug: 'description',
        name: 'Description Quiz',
        description: 'Guess the Pokemon from its Pokédex description',
        titleKey: 'description_quiz',
        descriptionKey: 'description_guessFromDescription',
        icon: '📝',
        SettingsComponent: DescriptionQuizSettingsComponent,
        QuizComponent: DescriptionQuiz,
        getCachedSettings: getCachedDescriptionSettings
    },
    {
        id: 'information-quiz',
        slug: 'information',
        name: 'Information Quiz',
        description: 'Guess the Pokemon from its characteristics',
        titleKey: 'information_quiz',
        descriptionKey: 'information_guessFromInfo',
        icon: 'ℹ️',
        SettingsComponent: InformationQuizSettingsComponent,
        QuizComponent: QuizInformation,
        getCachedSettings: getCachedInformationSettings
    },
    {
        id: 'sprites-quiz',
        slug: 'sprites',
        name: 'Sprites Quiz',
        description: 'Guess the Pokemon from its sprite',
        titleKey: 'sprites_quiz',
        descriptionKey: 'sprites_guessFromSprite',
        icon: '🎮',
        SettingsComponent: SpriteQuizSettingsComponent,
        QuizComponent: SpritesQuiz,
        getCachedSettings: getCachedSpriteSettings
    },
    {
        id: 'pokedle-quiz',
        slug: 'pokedle',
        name: 'Quiz Pokedle',
        description: 'Guess the Pokemon with Wordle-style feedback',
        titleKey: 'pokedle_quiz',
        descriptionKey: 'pokedle_guessFromInfo',
        icon: '🟩',
        SettingsComponent: PokedleQuizSettingsComponent,
        QuizComponent: QuizPokedle,
        getCachedSettings: getCachedPokedleSettings
    },
    {
        id: 'number-quiz',
        slug: 'number',
        name: 'Number Quiz',
        description: 'Guess the Pokédex number from the sprite',
        titleKey: 'number_quiz',
        descriptionKey: 'number_guessFromSprite',
        icon: '🔢',
        SettingsComponent: NumberQuizSettingsComponent,
        QuizComponent: QuizNumber,
        getCachedSettings: getCachedNumberSettings
    }
];

export const QUIZ_REGISTRY_MAP: Record<string, QuizRegistryEntry> = Object.fromEntries(
    QUIZ_REGISTRY.flatMap(entry => [
        [entry.id, entry],
        [entry.slug, entry]
    ])
);
