/**
 * @brief Image effect utilities for sprite processing
 * @description Client-side image manipulation using CSS filters and Canvas API
 */

import type { SpriteEffectSettings } from '../../../../shared/types';

/**
 * @brief Effect options for CSS filter generation
 */
export interface CssFilterOptions {
    /** Blur effect settings */
    blur: { enabled: boolean; strength: number };
    /** Silhouette (brightness: 0) effect */
    silhouette: boolean;
}

/**
 * @brief Generate CSS filter string from effect options
 * @param options - Effect options to apply
 * @returns CSS filter property value string
 * @example
 * getCssFilters({ blur: { enabled: true, strength: 5 }, silhouette: false })
 * // returns "blur(5px)"
 * getCssFilters({ blur: { enabled: false, strength: 0 }, silhouette: true })
 * // returns "brightness(0)"
 */
export function getCssFilters(options: CssFilterOptions): string {
    const filters: string[] = [];

    if (options.blur.enabled && options.blur.strength > 0) {
        filters.push(`blur(${options.blur.strength}px)`);
    }

    if (options.silhouette) {
        filters.push('brightness(0)');
    }

    return filters.length > 0 ? filters.join(' ') : 'none';
}

/**
 * @brief Generate CSS filter string from SpriteEffectSettings
 * @param effects - Sprite effect settings object
 * @returns CSS filter property value string
 * @example
 * getCssFiltersFromSettings({ blurEnabled: true, blurStrength: 5, silhouetteEnabled: true, ... })
 * // returns "blur(5px) brightness(0)"
 */
export function getCssFiltersFromSettings(effects: SpriteEffectSettings): string {
    return getCssFilters({
        blur: { enabled: effects.blurEnabled, strength: effects.blurStrength },
        silhouette: effects.silhouetteEnabled
    });
}

/**
 * @brief Available rotation angles in degrees
 */
const ROTATION_ANGLES = [0, 90, 180, 270] as const;

/**
 * @brief Get a random rotation angle
 * @returns Rotation angle in degrees (0, 90, 180, or 270)
 * @example
 * getRandomRotation() // returns 90
 */
export function getRandomRotation(): number {
    return ROTATION_ANGLES[Math.floor(Math.random() * ROTATION_ANGLES.length)];
}

/**
 * @brief Pixelate an image using Canvas API
 * @param imageUrl - Source image URL (must be CORS-accessible)
 * @param pixelSize - Size of each pixel block (higher = more pixelated)
 * @returns Promise resolving to data URL of pixelated image
 * @throws Error if canvas context is unavailable or image fails to load
 * @example
 * const pixelatedUrl = await pixelateImage('https://example.com/sprite.png', 10);
 */
export async function pixelateImage(
    imageUrl: string,
    pixelSize: number
): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                reject(new Error('Canvas 2D context not available'));
                return;
            }

            const w = img.width;
            const h = img.height;

            canvas.width = w;
            canvas.height = h;

            // Disable image smoothing for crisp pixelation
            ctx.imageSmoothingEnabled = false;

            // Calculate scaled dimensions
            const scaledW = Math.max(1, Math.ceil(w / pixelSize));
            const scaledH = Math.max(1, Math.ceil(h / pixelSize));

            // Draw small then scale up for pixelation effect
            ctx.drawImage(img, 0, 0, scaledW, scaledH);
            ctx.drawImage(canvas, 0, 0, scaledW, scaledH, 0, 0, w, h);

            resolve(canvas.toDataURL('image/png'));
        };

        img.onerror = () => {
            reject(new Error(`Failed to load image: ${imageUrl}`));
        };

        img.src = imageUrl;
    });
}

/**
 * @brief Check if any visual effect is enabled
 * @param effects - Sprite effect settings
 * @returns True if at least one effect is enabled
 * @example
 * hasAnyEffectEnabled({ blurEnabled: true, pixelateEnabled: false, ... }) // returns true
 */
export function hasAnyEffectEnabled(effects: SpriteEffectSettings): boolean {
    return (
        effects.blurEnabled ||
        effects.pixelateEnabled ||
        effects.silhouetteEnabled ||
        effects.rotationEnabled
    );
}
