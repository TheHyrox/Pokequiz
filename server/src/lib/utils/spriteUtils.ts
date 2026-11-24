/**
 * @brief Reusable server-side utilities for sprite quizzes (Sprites, Zoomed/Cropped, Shiny vs. Normal)
 * @description Centralizes sprite variant URL resolution, zoom-out step scheduling, and fake shiny hue angle generation
 */

import { SPRITE_URLS, getShinyQuizSpriteUrl, isValidPokemonId } from '../../../../shared/constants/sprites.js';
import type { SpriteSource, ZoomArtworkSource } from '../../../../shared/types/index.js';

export interface PokemonSpriteBundle {
    pokemonId: number;
    default: string;
    backDefault: string;
    shiny: string;
    home: string;
    homeShiny: string;
    official: string;
    officialShiny: string;
}

/**
 * @brief Computes a monotonically increasing crop percentage schedule from initialCropSize to 100%
 * @param initialCropSize - Starting crop percentage (clamped between 10% and 40%)
 * @param zoomStep - Percentage added on each wrong guess or hint (clamped between 5% and 35%)
 * @returns Array of crop percentages ending at 100
 */
export function computeZoomStepSchedule(initialCropSize: number = 30, zoomStep: number = 15): number[] {
    const start = Math.max(10, Math.min(40, Math.round(initialCropSize)));
    const step = Math.max(5, Math.min(35, Math.round(zoomStep)));
    const schedule: number[] = [start];

    let current = start;
    while (current < 100) {
        current = Math.min(100, current + step);
        if (schedule[schedule.length - 1] !== current) {
            schedule.push(current);
        }
    }
    return schedule;
}

/**
 * @brief Generates well-separated hue-shift angles (in degrees) for fake shiny sprites
 * @param totalOptions - Total options displayed (4 to 6, including 1 real shiny)
 * @param rng - Optional random number generator returning [0, 1)
 * @returns Array of `totalOptions - 1` hue shift angles in [40, 320]
 */
export function generateFakeHueAngles(totalOptions: number = 4, rng: () => number = Math.random): number[] {
    const clampedTotal = Math.max(2, Math.min(8, Math.round(totalOptions)));
    const fakeCount = clampedTotal - 1;
    const minAngle = 40;
    const maxAngle = 320;
    const span = maxAngle - minAngle;
    const segment = span / fakeCount;

    const angles: number[] = [];
    for (let i = 0; i < fakeCount; i++) {
        const segStart = minAngle + i * segment;
        const jitter = (rng() * 0.5 + 0.25) * segment;
        angles.push(Math.round(segStart + jitter));
    }
    return angles;
}

/**
 * @brief Reusable builder class for Pokemon sprite URLs and quiz metadata
 */
export class SpriteMetadataBuilder {
    /**
     * @brief Builds all available sprite URLs for a given Pokemon ID
     */
    public static buildSpriteBundle(pokemonId: number): PokemonSpriteBundle {
        const safeId = isValidPokemonId(pokemonId) ? pokemonId : 1;
        return {
            pokemonId: safeId,
            default: SPRITE_URLS.DEFAULT(safeId),
            backDefault: SPRITE_URLS.BACK_DEFAULT(safeId),
            shiny: SPRITE_URLS.SHINY(safeId),
            home: SPRITE_URLS.HOME(safeId),
            homeShiny: SPRITE_URLS.HOME_SHINY(safeId),
            official: SPRITE_URLS.OFFICIAL(safeId),
            officialShiny: SPRITE_URLS.OFFICIAL_SHINY(safeId)
        };
    }

    /**
     * @brief Resolves the artwork URL for the Zoomed / Cropped Sprite Quiz
     */
    public static getZoomArtworkUrl(pokemonId: number, source: ZoomArtworkSource = 'official'): string {
        return source === 'home' ? SPRITE_URLS.HOME(pokemonId) : SPRITE_URLS.OFFICIAL(pokemonId);
    }

    /**
     * @brief Resolves normal and shiny sprite pair for a given source
     */
    public static getShinyPair(pokemonId: number, source: SpriteSource = 'default'): { normal: string; shiny: string } {
        return {
            normal: getShinyQuizSpriteUrl(pokemonId, false, source),
            shiny: getShinyQuizSpriteUrl(pokemonId, true, source)
        };
    }
}
