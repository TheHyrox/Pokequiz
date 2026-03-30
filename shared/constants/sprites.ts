/**
 * @brief Pokemon sprite URL utilities
 * @description Centralized sprite URL generation for consistent usage across the app
 */

<<<<<<< HEAD
=======
import type { SpriteType, SpriteSource } from '../types';

>>>>>>> main
/**
 * @brief Base URL for PokeAPI sprites on GitHub
 */
const SPRITE_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

/**
 * @brief Available sprite variants
 */
export type SpriteVariant = 'default' | 'home' | 'official' | 'shiny';

/**
 * @brief Sprite URL generator functions by variant
 */
export const SPRITE_URLS = {
<<<<<<< HEAD
    /** Standard small sprite (96x96) */
    DEFAULT: (id: number): string => `${SPRITE_BASE_URL}/${id}.png`,
    /** High-quality Home artwork */
    HOME: (id: number): string => `${SPRITE_BASE_URL}/other/home/${id}.png`,
    /** Official Ken Sugimori artwork */
=======
    /** Standard small sprite (96x96) - front view */
    DEFAULT: (id: number): string => `${SPRITE_BASE_URL}/${id}.png`,
    /** Standard small sprite (96x96) - back view */
    BACK_DEFAULT: (id: number): string => `${SPRITE_BASE_URL}/back/${id}.png`,
    /** High-quality Home artwork (front only) */
    HOME: (id: number): string => `${SPRITE_BASE_URL}/other/home/${id}.png`,
    /** Official Ken Sugimori artwork (front only) */
>>>>>>> main
    OFFICIAL: (id: number): string => `${SPRITE_BASE_URL}/other/official-artwork/${id}.png`,
    /** Shiny variant sprite */
    SHINY: (id: number): string => `${SPRITE_BASE_URL}/shiny/${id}.png`
} as const;

/**
 * @brief Get Pokemon sprite URL
 * @param id - Pokemon National Pokedex ID
 * @param variant - Sprite variant to use
 * @returns Full URL string for the sprite image
 * @example
 * getSpriteUrl(25) // Pikachu default sprite
 * getSpriteUrl(25, 'home') // Pikachu Home artwork
 * getSpriteUrl(25, 'shiny') // Shiny Pikachu
 */
export function getSpriteUrl(id: number, variant: SpriteVariant = 'default'): string {
    switch (variant) {
        case 'home':
            return SPRITE_URLS.HOME(id);
        case 'official':
            return SPRITE_URLS.OFFICIAL(id);
        case 'shiny':
            return SPRITE_URLS.SHINY(id);
        default:
            return SPRITE_URLS.DEFAULT(id);
    }
}

/**
 * @brief Check if a sprite URL is likely valid
 * @param id - Pokemon ID to check
 * @returns True if ID is in valid range
 */
export function isValidPokemonId(id: number): boolean {
    return Number.isInteger(id) && id >= 1 && id <= 1025;
}
<<<<<<< HEAD
=======

/**
 * @brief Result of sprite URL resolution with fallback info
 */
export interface SpriteUrlResult {
    url: string;
    usedFallback: boolean;
    requestedType: SpriteType;
    requestedSource: SpriteSource;
    actualType: SpriteType;
    actualSource: SpriteSource;
}

/**
 * @brief Get sprite URL for quiz with type and source selection
 * @param id - Pokemon National Pokedex ID
 * @param type - Sprite view type ('front' or 'back')
 * @param source - Sprite source/quality ('default', 'home', or 'official')
 * @returns Full URL string for the sprite image
 * @description Note: 'home' and 'official' only have front views,
 *              so back type with these sources falls back to default back sprite
 * @example
 * getQuizSpriteUrl(25, 'front', 'home') // Pikachu Home front
 * getQuizSpriteUrl(25, 'back', 'default') // Pikachu default back
 */
export function getQuizSpriteUrl(
    id: number,
    type: SpriteType,
    source: SpriteSource
): string {
    // Back sprites only exist for default variant
    if (type === 'back') {
        return SPRITE_URLS.BACK_DEFAULT(id);
    }

    // Front sprites with different sources
    switch (source) {
        case 'home':
            return SPRITE_URLS.HOME(id);
        case 'official':
            return SPRITE_URLS.OFFICIAL(id);
        default:
            return SPRITE_URLS.DEFAULT(id);
    }
}

/**
 * @brief Attempt to load sprite with fallback strategy for 404 errors
 * @param id - Pokemon National Pokedex ID
 * @param type - Preferred sprite view type ('front' or 'back')
 * @param source - Preferred sprite source/quality ('default', 'home', or 'official')
 * @param timeoutMs - Timeout for fetch request in milliseconds
 * @returns Promise resolving to sprite URL result with fallback information
 * @description Tries to load the requested sprite URL, and if it returns 404 or fails,
 *              falls back to other type/source combinations until a valid URL is found
 * @example
 * const result = await getQuizSpriteUrlWithFallback(25, 'front', 'home');
 * if (result.usedFallback) {
 *     console.log(`Fallback used: ${result.actualSource} ${result.actualType}`);
 * }
 */
export async function getQuizSpriteUrlWithFallback(
    id: number,
    type: SpriteType,
    source: SpriteSource,
    timeoutMs: number = 5000
): Promise<SpriteUrlResult> {
    const sources: SpriteSource[] = ['default', 'home', 'official'];
    const types: SpriteType[] = ['front', 'back'];

    /**
     * @brief Try to fetch a URL and check if it exists
     */
    async function tryUrl(testUrl: string): Promise<boolean> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            const response = await fetch(testUrl, {
                method: 'HEAD',
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            return response.ok || response.status !== 404;
        } catch (error) {
            // On network error or timeout, assume URL might work
            return true;
        }
    }

    // Try the requested combination first
    let url = getQuizSpriteUrl(id, type, source);
    if (await tryUrl(url)) {
        return {
            url,
            usedFallback: false,
            requestedType: type,
            requestedSource: source,
            actualType: type,
            actualSource: source
        };
    }

    // Fallback strategy: try source variations first, then type variations
    const fallbackSources = sources.filter(s => s !== source);
    const fallbackTypes = types.filter(t => t !== type);

    // Try other sources with same type
    for (const fallbackSource of fallbackSources) {
        url = getQuizSpriteUrl(id, type, fallbackSource);
        if (await tryUrl(url)) {
            return {
                url,
                usedFallback: true,
                requestedType: type,
                requestedSource: source,
                actualType: type,
                actualSource: fallbackSource
            };
        }
    }

    // Try other types with any source
    for (const fallbackType of fallbackTypes) {
        for (const fallbackSource of sources) {
            url = getQuizSpriteUrl(id, fallbackType, fallbackSource);
            if (await tryUrl(url)) {
                return {
                    url,
                    usedFallback: true,
                    requestedType: type,
                    requestedSource: source,
                    actualType: fallbackType,
                    actualSource: fallbackSource
                };
            }
        }
    }

    // Last resort: return default front sprite
    return {
        url: SPRITE_URLS.DEFAULT(id),
        usedFallback: true,
        requestedType: type,
        requestedSource: source,
        actualType: 'front',
        actualSource: 'default'
    };
}
>>>>>>> main
