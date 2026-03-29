/**
 * @brief Pokemon sprite URL utilities
 * @description Centralized sprite URL generation for consistent usage across the app
 */

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
    /** Standard small sprite (96x96) */
    DEFAULT: (id: number): string => `${SPRITE_BASE_URL}/${id}.png`,
    /** High-quality Home artwork */
    HOME: (id: number): string => `${SPRITE_BASE_URL}/other/home/${id}.png`,
    /** Official Ken Sugimori artwork */
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
