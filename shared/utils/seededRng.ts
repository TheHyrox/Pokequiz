/**
 * @brief Deterministic Seeded Pseudo-Random Number Generator (PRNG)
 * @description Uses xmur3 string hashing + mulberry32 PRNG so everyone gets the exact same
 *              daily Pokémon for a given date (YYYY-MM-DD) and quiz mode without any backend state.
 */

import { ALL_GENERATIONS } from '../constants/index.js';
import { getRandomPokemonId } from './pokemonUtils.js';

/**
 * @brief Formats a Date (defaults to today in local time) as YYYY-MM-DD
 */
export function getTodayDateString(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * @brief Hashes an arbitrary seed string into a 32-bit unsigned integer (xmur3)
 */
export function hashSeedString(str: string): number {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
        h = (h << 13) | (h >>> 19);
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
}

/**
 * @brief Creates a deterministic Mulberry32 PRNG function returning floats in [0, 1)
 * @param seedStr - Seed string (e.g. "2026-11-23:pokedle")
 */
export function createSeededRng(seedStr: string): () => number {
    let a = hashSeedString(seedStr);
    return function (): number {
        let t = (a += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * @brief Deterministically picks a Pokemon ID for a daily challenge round
 * @param dateStr - Date string YYYY-MM-DD
 * @param quizSlug - Quiz identifier ('pokedle' | 'description' | 'number')
 * @param roundIndex - 0-based round index
 * @param generations - Selected generations (defaults to all 1-9)
 */
export function getDailyPokemonId(
    dateStr: string,
    quizSlug: string,
    roundIndex: number = 0,
    generations: number[] = ALL_GENERATIONS
): number {
    const rng = createSeededRng(`${dateStr}:${quizSlug}:round:${roundIndex}`);
    return getRandomPokemonId(generations, rng);
}

/**
 * @brief Deterministically shuffles an array using a seeded RNG (Fisher-Yates)
 */
export function seededShuffle<T>(items: T[], rng: () => number): T[] {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
