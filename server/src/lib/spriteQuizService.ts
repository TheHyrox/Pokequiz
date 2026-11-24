/**
 * @brief Reusable server service for Quiz Catalog and Sprite/Zoom/Shiny Quiz metadata
 * @description Provides centralized quiz definitions and sprite quiz metadata endpoints
 */

import { getPokemonById, getLocalizedEnrichedPokemon } from './pokemonData.js';
import {
    SpriteMetadataBuilder,
    computeZoomStepSchedule,
    generateFakeHueAngles,
    type PokemonSpriteBundle
} from './utils/spriteUtils.js';
import type { SpriteSource, ZoomArtworkSource } from '../../../shared/types/index.js';

export interface ServerQuizCatalogItem {
    id: string;
    slug: string;
    name: string;
    titleKey: string;
    descriptionKey: string;
    icon: string;
    modes: string[];
    difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface SpriteQuizMetadataResponse {
    id: number;
    name: string;
    sprites: PokemonSpriteBundle;
    zoomQuiz: {
        artworkUrl: string;
        source: ZoomArtworkSource;
        cropSchedule: number[];
    };
    shinyQuiz: {
        source: SpriteSource;
        normalUrl: string;
        shinyUrl: string;
        fakeHueAngles: number[];
    };
}

/**
 * @brief Service class managing the quiz catalog and sprite quiz helper data
 */
export class SpriteQuizService {
    private static readonly CATALOG: ServerQuizCatalogItem[] = [
        {
            id: 'description-quiz',
            slug: 'description',
            name: 'Description Quiz',
            titleKey: 'description_quiz',
            descriptionKey: 'description_guessFromDescription',
            icon: '📝',
            modes: ['score', 'infinite', 'challenge', 'hardcore'],
            difficulty: 'Medium'
        },
        {
            id: 'information-quiz',
            slug: 'information',
            name: 'Information Quiz',
            titleKey: 'information_quiz',
            descriptionKey: 'information_guessFromInfo',
            icon: 'ℹ️',
            modes: ['easy', 'normal', 'challenge', 'hardcore'],
            difficulty: 'Hard'
        },
        {
            id: 'sprites-quiz',
            slug: 'sprites',
            name: 'Sprites Quiz',
            titleKey: 'sprites_quiz',
            descriptionKey: 'sprites_guessFromSprite',
            icon: '🎮',
            modes: ['score', 'infinite', 'challenge', 'hardcore'],
            difficulty: 'Easy'
        },
        {
            id: 'zoom-quiz',
            slug: 'zoom',
            name: 'Zoomed Sprite Quiz',
            titleKey: 'zoom_quiz',
            descriptionKey: 'zoom_guessFromCrop',
            icon: '🔍',
            modes: ['score', 'infinite', 'challenge', 'hardcore'],
            difficulty: 'Medium'
        },
        {
            id: 'shiny-quiz',
            slug: 'shiny',
            name: 'Shiny Quiz',
            titleKey: 'shiny_quiz',
            descriptionKey: 'shiny_guessFromShiny',
            icon: '✨',
            modes: ['score', 'infinite', 'challenge', 'hardcore'],
            difficulty: 'Medium'
        },
        {
            id: 'pokedle-quiz',
            slug: 'pokedle',
            name: 'Quiz Pokedle',
            titleKey: 'pokedle_quiz',
            descriptionKey: 'pokedle_guessFromInfo',
            icon: '🟩',
            modes: ['wordle'],
            difficulty: 'Medium'
        },
        {
            id: 'number-quiz',
            slug: 'number',
            name: 'Number Quiz',
            titleKey: 'number_quiz',
            descriptionKey: 'number_guessFromSprite',
            icon: '🔢',
            modes: ['normal', 'points'],
            difficulty: 'Hard'
        }
    ];

    /**
     * @brief Returns the full catalog of available quizzes
     */
    public getQuizCatalog(): ServerQuizCatalogItem[] {
        return SpriteQuizService.CATALOG;
    }

    /**
     * @brief Builds localized sprite quiz metadata for a Pokemon ID
     */
    public async getPokemonSpriteMetadata(
        idParam: string | number,
        langCode: string = 'en',
        options?: {
            zoomSource?: ZoomArtworkSource;
            initialCropSize?: number;
            zoomStep?: number;
            shinySource?: SpriteSource;
            fakeOptionsCount?: number;
        }
    ): Promise<SpriteQuizMetadataResponse | null> {
        const numericId = typeof idParam === 'number' ? idParam : parseInt(String(idParam), 10);
        if (isNaN(numericId)) return null;

        const basePokemon = getPokemonById(numericId);
        if (!basePokemon) return null;

        const enriched = await getLocalizedEnrichedPokemon(numericId, langCode);
        const localizedName = enriched?.name || basePokemon.name;

        const zoomSource: ZoomArtworkSource = options?.zoomSource === 'home' ? 'home' : 'official';
        const shinySource: SpriteSource =
            options?.shinySource && ['default', 'home', 'official'].includes(options.shinySource)
                ? options.shinySource
                : 'default';

        const sprites = SpriteMetadataBuilder.buildSpriteBundle(numericId);
        const shinyPair = SpriteMetadataBuilder.getShinyPair(numericId, shinySource);

        return {
            id: numericId,
            name: localizedName,
            sprites,
            zoomQuiz: {
                artworkUrl: SpriteMetadataBuilder.getZoomArtworkUrl(numericId, zoomSource),
                source: zoomSource,
                cropSchedule: computeZoomStepSchedule(options?.initialCropSize ?? 30, options?.zoomStep ?? 15)
            },
            shinyQuiz: {
                source: shinySource,
                normalUrl: shinyPair.normal,
                shinyUrl: shinyPair.shiny,
                fakeHueAngles: generateFakeHueAngles(options?.fakeOptionsCount ?? 4)
            }
        };
    }
}

export const spriteQuizService = new SpriteQuizService();
