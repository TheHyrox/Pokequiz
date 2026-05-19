/**
 * @brief Shared Pokemon utility helpers
 * @description Browser-safe helpers used by both client and server
 */

import { GENERATION_RANGES, TOTAL_POKEMON } from '../constants/index.js';
import type { GenerationRange } from '../types';

/**
 * @brief Gets a random integer from 0 to max-1
 * @param max - Upper bound (exclusive)
 * @returns Random integer in range [0, max)
 */
export function getRandomInt(max: number): number {
    return Math.floor(Math.random() * max);
}

/**
 * @brief Gets a random Pokemon ID from selected generations
 * @param selectedGenerations - Array of generation numbers to include
 * @returns Random Pokemon ID within the selected generations
 */
export function getRandomPokemonId(selectedGenerations: number[]): number {
    if (selectedGenerations.length === 0) {
        return getRandomInt(TOTAL_POKEMON) + 1;
    }

    const validRanges: GenerationRange[] = selectedGenerations
        .filter(gen => GENERATION_RANGES[gen])
        .map(gen => GENERATION_RANGES[gen]);

    if (validRanges.length === 0) {
        return getRandomInt(TOTAL_POKEMON) + 1;
    }

    const randomRange = validRanges[Math.floor(Math.random() * validRanges.length)];
    const offset = Math.floor(Math.random() * (randomRange.max - randomRange.min + 1));
    return randomRange.min + offset;
}

/**
 * @brief Maps generation string to PokeAPI version group IDs
 * @param generation - Generation number as string (1-9)
 * @returns Array of version group IDs for that generation, or null if invalid
 */
export function generationToId(generation: string): number[] | null {
    const generationVersionIds: Record<string, number[]> = {
        '1': [32, 31, 46, 45, 44, 3, 2, 1],
        '2': [6, 5, 4],
        '3': [11, 10, 9, 8, 7],
        '4': [39, 38, 37, 16, 15, 14, 13, 12],
        '5': [22, 21, 18, 17],
        '6': [26, 25, 24, 23],
        '7': [30, 29, 28, 27],
        '8': [36, 35, 34, 33],
        '9': [43, 42, 41, 40]
    };

    return generationVersionIds[generation] ?? null;
}