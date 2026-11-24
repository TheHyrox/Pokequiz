/**
 * @brief Pokemon sprite URL utilities
 * @description Centralized sprite URL generation for consistent usage across the app
 */

import type { SpriteType, SpriteSource } from '../types';

/**
 * @brief Base URL for PokeAPI sprites on GitHub
 */
const SPRITE_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

/**
 * @brief Available sprite variants
 */
export type SpriteVariant = 'default' | 'home' | 'home_shiny' | 'official' | 'official_shiny' | 'shiny';

/**
 * @brief Sprite URL generator functions by variant
 */
export const SPRITE_URLS = {
    /** Standard small sprite (96x96) - front view */
    DEFAULT: (id: number): string => `${SPRITE_BASE_URL}/${id}.png`,
    /** Standard small sprite (96x96) - back view */
    BACK_DEFAULT: (id: number): string => `${SPRITE_BASE_URL}/back/${id}.png`,
    /** High-quality Home artwork (front only) */
    HOME: (id: number): string => `${SPRITE_BASE_URL}/other/home/${id}.png`,
    /** High-quality Home shiny artwork (front only) */
    HOME_SHINY: (id: number): string => `${SPRITE_BASE_URL}/other/home/shiny/${id}.png`,
    /** Official Ken Sugimori artwork (front only) */
    OFFICIAL: (id: number): string => `${SPRITE_BASE_URL}/other/official-artwork/${id}.png`,
    /** Official Ken Sugimori shiny artwork (front only) */
    OFFICIAL_SHINY: (id: number): string => `${SPRITE_BASE_URL}/other/official-artwork/shiny/${id}.png`,
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
        case 'home_shiny':
            return SPRITE_URLS.HOME_SHINY(id);
        case 'official':
            return SPRITE_URLS.OFFICIAL(id);
        case 'official_shiny':
            return SPRITE_URLS.OFFICIAL_SHINY(id);
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

/**
 * @brief Get normal or shiny sprite URL for the Shiny vs. Normal Quiz
 * @param id - Pokemon National Pokedex ID
 * @param isShiny - Whether to return the shiny variant
 * @param source - Sprite source ('default', 'home', or 'official')
 * @returns Full URL string for the normal or shiny sprite
 */
export function getShinyQuizSpriteUrl(
    id: number,
    isShiny: boolean,
    source: SpriteSource = 'default'
): string {
    if (isShiny) {
        switch (source) {
            case 'home':
                return SPRITE_URLS.HOME_SHINY(id);
            case 'official':
                return SPRITE_URLS.OFFICIAL_SHINY(id);
            default:
                return SPRITE_URLS.SHINY(id);
        }
    }

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
 * @brief Result of resolving a normal + shiny sprite pair with fallback support
 */
export interface ShinySpritePairResult {
    normalUrl: string;
    shinyUrl: string;
    actualSource: SpriteSource;
    usedFallback: boolean;
}

/**
 * @brief Resolve both normal and shiny sprite URLs for a Pokemon with fallback to 'default' (SPRITE_URLS.SHINY)
 */
export async function getShinySpritePairWithFallback(
    id: number,
    preferredSource: SpriteSource = 'default',
    timeoutMs: number = 5000
): Promise<ShinySpritePairResult> {
    const candidateSources: SpriteSource[] = [
        preferredSource,
        ...(['default', 'home', 'official'] as SpriteSource[]).filter(s => s !== preferredSource)
    ];

    async function checkExists(testUrl: string): Promise<boolean> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
            const response = await fetch(testUrl, {
                method: 'HEAD',
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response.ok || response.status !== 404;
        } catch {
            return true;
        }
    }

    for (const src of candidateSources) {
        const normalUrl = getShinyQuizSpriteUrl(id, false, src);
        const shinyUrl = getShinyQuizSpriteUrl(id, true, src);
        const [normalOk, shinyOk] = await Promise.all([checkExists(normalUrl), checkExists(shinyUrl)]);
        if (normalOk && shinyOk) {
            return {
                normalUrl,
                shinyUrl,
                actualSource: src,
                usedFallback: src !== preferredSource
            };
        }
    }

    return {
        normalUrl: SPRITE_URLS.DEFAULT(id),
        shinyUrl: SPRITE_URLS.SHINY(id),
        actualSource: 'default',
        usedFallback: preferredSource !== 'default'
    };
}

