/**
 * @brief Sprite effect limits configuration
 * @description Dynamic limits for blur and pixelate based on sprite source, type, and effects
 */

import type { SpriteSource, SpriteType } from '../../../../shared/types';

/**
 * @brief Effect strength limits with multiple recommendation levels
 */
export interface EffectLimit {
    /** Minimum value for the effect */
    min: number;
    /** Maximum value for the effect */
    max: number;
    /** Recommended value when this is the single effect enabled */
    recommendedSingle: number;
    /** Recommended value when combined with blur (for pixelate) or pixelate (for blur) */
    recommendedWithOtherEffect?: number;
    /** Recommended value when combined with silhouette */
    recommendedWithSilhouette: number;
    /** Recommended value when all three effects are enabled */
    recommendedTriple: number;
}

/**
 * @brief Limits for a specific sprite configuration
 */
interface SpriteLimits {
    blur: EffectLimit;
    pixelate: EffectLimit;
}

/**
 * @brief All effect limit configurations
 * @description Maps combinations of sprite source+type to their respective limits
 */
const EFFECT_LIMITS: Record<string, Record<string, SpriteLimits>> = {
    // Front sprites
    'front-default': {
        base: {
            blur: { min: 3, max: 10, recommendedSingle: 6, recommendedWithOtherEffect: 5, recommendedWithSilhouette: 5, recommendedTriple: 5 },
            pixelate: { min: 4, max: 12, recommendedSingle: 8, recommendedWithOtherEffect: 8, recommendedWithSilhouette: 8, recommendedTriple: 8 }
        },
        blackout: {
            blur: { min: 3, max: 8, recommendedSingle: 5, recommendedWithOtherEffect: 5, recommendedWithSilhouette: 5, recommendedTriple: 5 },
            pixelate: { min: 4, max: 10, recommendedSingle: 6, recommendedWithOtherEffect: 5, recommendedWithSilhouette: 5, recommendedTriple: 5 }
        }
    },
    'front-home': {
        base: {
            blur: { min: 5, max: 10, recommendedSingle: 7, recommendedWithOtherEffect: 10, recommendedWithSilhouette: 8, recommendedTriple: 10 },
            pixelate: { min: 10, max: 20, recommendedSingle: 15, recommendedWithOtherEffect: 15, recommendedWithSilhouette: 15, recommendedTriple: 15 }
        },
        blackout: {
            blur: { min: 5, max: 10, recommendedSingle: 7, recommendedWithOtherEffect: 10, recommendedWithSilhouette: 8, recommendedTriple: 10 },
            pixelate: { min: 10, max: 20, recommendedSingle: 15, recommendedWithOtherEffect: 15, recommendedWithSilhouette: 15, recommendedTriple: 15 }
        }
    },
    'front-official': {
        base: {
            blur: { min: 5, max: 10, recommendedSingle: 8, recommendedWithOtherEffect: 10, recommendedWithSilhouette: 7, recommendedTriple: 10 },
            pixelate: { min: 10, max: 20, recommendedSingle: 15, recommendedWithOtherEffect: 15, recommendedWithSilhouette: 15, recommendedTriple: 15 }
        },
        blackout: {
            blur: { min: 5, max: 10, recommendedSingle: 8, recommendedWithOtherEffect: 10, recommendedWithSilhouette: 7, recommendedTriple: 10 },
            pixelate: { min: 10, max: 20, recommendedSingle: 15, recommendedWithOtherEffect: 15, recommendedWithSilhouette: 15, recommendedTriple: 15 }
        }
    },
    // Back sprites
    'back-default': {
        base: {
            blur: { min: 3, max: 8, recommendedSingle: 5, recommendedWithOtherEffect: 5, recommendedWithSilhouette: 5, recommendedTriple: 5 },
            pixelate: { min: 3, max: 10, recommendedSingle: 6, recommendedWithOtherEffect: 5, recommendedWithSilhouette: 5, recommendedTriple: 5 }
        },
        blackout: {
            blur: { min: 3, max: 8, recommendedSingle: 5, recommendedWithOtherEffect: 5, recommendedWithSilhouette: 5, recommendedTriple: 5 },
            pixelate: { min: 3, max: 10, recommendedSingle: 6, recommendedWithOtherEffect: 5, recommendedWithSilhouette: 5, recommendedTriple: 5 }
        }
    },
    'back-home': {
        base: {
            blur: { min: 5, max: 10, recommendedSingle: 7, recommendedWithOtherEffect: 10, recommendedWithSilhouette: 8, recommendedTriple: 10 },
            pixelate: { min: 10, max: 20, recommendedSingle: 15, recommendedWithOtherEffect: 15, recommendedWithSilhouette: 15, recommendedTriple: 15 }
        },
        blackout: {
            blur: { min: 5, max: 10, recommendedSingle: 7, recommendedWithOtherEffect: 10, recommendedWithSilhouette: 8, recommendedTriple: 10 },
            pixelate: { min: 10, max: 20, recommendedSingle: 15, recommendedWithOtherEffect: 15, recommendedWithSilhouette: 15, recommendedTriple: 15 }
        }
    },
    'back-official': {
        base: {
            blur: { min: 5, max: 10, recommendedSingle: 8, recommendedWithOtherEffect: 10, recommendedWithSilhouette: 7, recommendedTriple: 10 },
            pixelate: { min: 10, max: 20, recommendedSingle: 15, recommendedWithOtherEffect: 15, recommendedWithSilhouette: 15, recommendedTriple: 15 }
        },
        blackout: {
            blur: { min: 5, max: 10, recommendedSingle: 8, recommendedWithOtherEffect: 10, recommendedWithSilhouette: 7, recommendedTriple: 10 },
            pixelate: { min: 10, max: 20, recommendedSingle: 15, recommendedWithOtherEffect: 15, recommendedWithSilhouette: 15, recommendedTriple: 15 }
        }
    }
};

/**
 * @brief Get effect limits for a sprite configuration
 * @param spriteTypes Selected sprite types (front/back)
 * @param spriteSource Sprite source (default, home, official)
 * @param hasBlackout Whether silhouette/blackout effect is enabled
 * @returns Effect limits for blur and pixelate
 */
export function getEffectLimits(
    spriteTypes: SpriteType[],
    spriteSource: SpriteSource,
    hasBlackout: boolean
): SpriteLimits {
    // Get the first sprite type (or use 'front' as default for limit selection)
    const spriteType = spriteTypes.includes('front') ? 'front' : 'back';
    
    // Handle official sprite source (fallback to home)
    const source = spriteSource === 'official' ? 'home' : spriteSource;
    
    const key = `${spriteType}-${source}`;
    const configKey = hasBlackout ? 'blackout' : 'base';
    
    const limits = EFFECT_LIMITS[key]?.[configKey];
    
    if (!limits) {
        // Fallback to front-default if configuration not found
        return EFFECT_LIMITS['front-default']['base'];
    }
    
    return limits;
}

/**
 * @brief Get blur limits for current sprite configuration
 */
export function getBlurLimits(
    spriteTypes: SpriteType[],
    spriteSource: SpriteSource,
    hasBlackout: boolean
): EffectLimit {
    const limits = getEffectLimits(spriteTypes, spriteSource, hasBlackout);
    return limits.blur;
}

/**
 * @brief Get pixelate limits for current sprite configuration
 */
export function getPixelateLimits(
    spriteTypes: SpriteType[],
    spriteSource: SpriteSource,
    hasBlackout: boolean
): EffectLimit {
    const limits = getEffectLimits(spriteTypes, spriteSource, hasBlackout);
    return limits.pixelate;
}

/**
 * @brief Get the recommended blur value based on active effects
 * @param spriteTypes Selected sprite types
 * @param spriteSource Sprite source
 * @param blurEnabled Whether blur is enabled
 * @param pixelateEnabled Whether pixelate is enabled
 * @param silhouetteEnabled Whether silhouette is enabled
 */
export function getRecommendedBlur(
    spriteTypes: SpriteType[],
    spriteSource: SpriteSource,
    blurEnabled: boolean,
    pixelateEnabled: boolean,
    silhouetteEnabled: boolean
): number {
    if (!blurEnabled) return 0;
    
    const limits = getBlurLimits(spriteTypes, spriteSource, silhouetteEnabled);
    const enabledCount = [blurEnabled, pixelateEnabled, silhouetteEnabled].filter(Boolean).length;
    
    if (enabledCount === 1) {
        return limits.recommendedSingle;
    } else if (enabledCount === 2) {
        if (pixelateEnabled) {
            return limits.recommendedWithOtherEffect || limits.recommendedSingle;
        } else {
            return limits.recommendedWithSilhouette;
        }
    } else {
        return limits.recommendedTriple;
    }
}

/**
 * @brief Get the recommended pixelate value based on active effects
 * @param spriteTypes Selected sprite types
 * @param spriteSource Sprite source
 * @param blurEnabled Whether blur is enabled
 * @param pixelateEnabled Whether pixelate is enabled
 * @param silhouetteEnabled Whether silhouette is enabled
 */
export function getRecommendedPixelate(
    spriteTypes: SpriteType[],
    spriteSource: SpriteSource,
    blurEnabled: boolean,
    pixelateEnabled: boolean,
    silhouetteEnabled: boolean
): number {
    if (!pixelateEnabled) return 0;
    
    const limits = getPixelateLimits(spriteTypes, spriteSource, silhouetteEnabled);
    const enabledCount = [blurEnabled, pixelateEnabled, silhouetteEnabled].filter(Boolean).length;
    
    if (enabledCount === 1) {
        return limits.recommendedSingle;
    } else if (enabledCount === 2) {
        if (blurEnabled) {
            return limits.recommendedWithOtherEffect || limits.recommendedSingle;
        } else {
            return limits.recommendedWithSilhouette;
        }
    } else {
        return limits.recommendedTriple;
    }
}

/**
 * @brief Clamp a value between min and max
 */
export function clampValue(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}
