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
/**
 * @brief Get a random rotation angle
 * @returns Rotation angle in degrees (integer between 0 and 359 inclusive)
 * @example
 * getRandomRotation() // returns 237
 */
export function getRandomRotation(): number {
    return Math.floor(Math.random() * 360);
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

            // Create temporary canvas for small pixelated version
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            
            if (!tempCtx) {
                reject(new Error('Temporary canvas context not available'));
                return;
            }

            tempCanvas.width = scaledW;
            tempCanvas.height = scaledH;
            tempCtx.imageSmoothingEnabled = false;
            tempCtx.drawImage(img, 0, 0, scaledW, scaledH);

            // Draw scaled-up from temp canvas to main canvas
            ctx.drawImage(tempCanvas, 0, 0, scaledW, scaledH, 0, 0, w, h);

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

// ============================================================
// ZOOMED / CROPPED SPRITE UTILITIES (CANVAS)
// ============================================================

export interface NonTransparentBounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
    imgWidth: number;
    imgHeight: number;
}

export interface CropFocusPoint {
    /** Normalized [0..1] X position inside the non-transparent bounding box */
    normX: number;
    /** Normalized [0..1] Y position inside the non-transparent bounding box */
    normY: number;
}

/**
 * @brief Computes a monotonically increasing crop percentage schedule from initialCropSize to 100%
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
 * @brief Reusable Canvas artwork cropper that detects non-transparent Pokemon bounds
 *        and renders smooth zoomed-out square crops from 25%–40% up to 100%
 */
export class ArtworkCropper {
    private img: HTMLImageElement | null = null;
    private bounds: NonTransparentBounds | null = null;
    private imageData: ImageData | null = null;
    private focus: CropFocusPoint = { normX: 0.5, normY: 0.45 };

    /**
     * @brief Loads an image URL and analyzes its non-transparent bounding box
     */
    public async load(imageUrl: string, rng: () => number = Math.random): Promise<void> {
        const loadedImg = await new Promise<HTMLImageElement>((resolve, reject) => {
            const el = new Image();
            el.crossOrigin = 'anonymous';
            el.onload = () => resolve(el);
            el.onerror = () => reject(new Error(`Failed to load artwork: ${imageUrl}`));
            el.src = imageUrl;
        });

        this.img = loadedImg;
        const w = loadedImg.width || 475;
        const h = loadedImg.height || 475;

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            this.bounds = { minX: 0, minY: 0, maxX: w, maxY: h, width: w, height: h, imgWidth: w, imgHeight: h };
            this.focus = { normX: 0.5, normY: 0.5 };
            return;
        }

        ctx.drawImage(loadedImg, 0, 0);
        const imgData = ctx.getImageData(0, 0, w, h);
        this.imageData = imgData;
        const data = imgData.data;

        let minX = w;
        let minY = h;
        let maxX = 0;
        let maxY = 0;
        let foundOpaque = false;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const alpha = data[(y * w + x) * 4 + 3];
                if (alpha > 16) {
                    foundOpaque = true;
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }
        }

        if (!foundOpaque || maxX <= minX || maxY <= minY) {
            this.bounds = { minX: 0, minY: 0, maxX: w, maxY: h, width: w, height: h, imgWidth: w, imgHeight: h };
        } else {
            this.bounds = {
                minX,
                minY,
                maxX,
                maxY,
                width: Math.max(16, maxX - minX + 1),
                height: Math.max(16, maxY - minY + 1),
                imgWidth: w,
                imgHeight: h
            };
        }

        this.focus = this.pickOpaqueFocusPoint(rng);
    }

    /**
     * @brief Picks a focus center inside the Pokemon's bounding box that contains rich non-transparent detail
     */
    private pickOpaqueFocusPoint(rng: () => number): CropFocusPoint {
        if (!this.bounds || !this.imageData) {
            return { normX: 0.5, normY: 0.45 };
        }

        const { minX, minY, width, height, imgWidth, imgHeight } = this.bounds;
        const data = this.imageData.data;
        const sampleWindow = Math.max(16, Math.round(Math.min(width, height) * 0.28));
        const halfWin = Math.floor(sampleWindow / 2);

        let bestFocus: CropFocusPoint = { normX: 0.5, normY: 0.45 };
        let bestFillRatio = -1;

        for (let attempt = 0; attempt < 18; attempt++) {
            const normX = 0.22 + rng() * 0.56;
            const normY = 0.20 + rng() * 0.60;
            const cx = Math.round(minX + normX * width);
            const cy = Math.round(minY + normY * height);

            const x0 = Math.max(0, cx - halfWin);
            const y0 = Math.max(0, cy - halfWin);
            const x1 = Math.min(imgWidth - 1, cx + halfWin);
            const y1 = Math.min(imgHeight - 1, cy + halfWin);

            let opaqueCount = 0;
            let totalSampled = 0;
            for (let y = y0; y <= y1; y += 2) {
                for (let x = x0; x <= x1; x += 2) {
                    totalSampled++;
                    if (data[(y * imgWidth + x) * 4 + 3] > 24) {
                        opaqueCount++;
                    }
                }
            }

            const fillRatio = totalSampled > 0 ? opaqueCount / totalSampled : 0;
            // Prefer regions that are 35% - 88% filled (captures distinct edges + features)
            if (fillRatio >= 0.35 && fillRatio <= 0.90) {
                return { normX, normY };
            }
            if (fillRatio > bestFillRatio) {
                bestFillRatio = fillRatio;
                bestFocus = { normX, normY };
            }
        }

        return bestFocus;
    }

    /**
     * @brief Renders the artwork cropped to `cropPercent` (25-100) around the focus point
     * @param cropPercent - Percentage of the bounding box to reveal (100 = full image)
     * @param outputSize - Output square canvas dimension in pixels
     * @returns Data URL (`data:image/png;base64,...`) of the cropped region
     */
    public renderCrop(cropPercent: number, outputSize: number = 360): string {
        if (!this.img || !this.bounds) {
            return '';
        }

        const clampedPercent = Math.max(10, Math.min(100, cropPercent));
        const ratio = clampedPercent / 100;
        const { minX, minY, width, height, imgWidth, imgHeight } = this.bounds;

        const baseSide = Math.max(width, height);
        const cropSide = Math.max(20, Math.round(baseSide * ratio));

        const focusX = minX + this.focus.normX * width;
        const focusY = minY + this.focus.normY * height;

        // Smoothly interpolate center towards the bounding box center as ratio approaches 1.0
        const boxCenterX = minX + width / 2;
        const boxCenterY = minY + height / 2;
        const blend = Math.max(0, Math.min(1, (ratio - 0.3) / 0.7));
        const centerX = focusX * (1 - blend) + boxCenterX * blend;
        const centerY = focusY * (1 - blend) + boxCenterY * blend;

        let sx = Math.round(centerX - cropSide / 2);
        let sy = Math.round(centerY - cropSide / 2);

        // Clamp within image bounds when possible
        if (cropSide <= imgWidth) {
            sx = Math.max(0, Math.min(imgWidth - cropSide, sx));
        } else {
            sx = Math.round((imgWidth - cropSide) / 2);
        }
        if (cropSide <= imgHeight) {
            sy = Math.max(0, Math.min(imgHeight - cropSide, sy));
        } else {
            sy = Math.round((imgHeight - cropSide) / 2);
        }

        const outCanvas = document.createElement('canvas');
        outCanvas.width = outputSize;
        outCanvas.height = outputSize;
        const ctx = outCanvas.getContext('2d');
        if (!ctx) return this.img.src;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.clearRect(0, 0, outputSize, outputSize);
        ctx.drawImage(this.img, sx, sy, cropSide, cropSide, 0, 0, outputSize, outputSize);

        return outCanvas.toDataURL('image/png');
    }

    public getFocusPoint(): CropFocusPoint {
        return this.focus;
    }
}

// ============================================================
// SHINY QUIZ HUE-SHIFT UTILITIES (CANVAS)
// ============================================================

/**
 * @brief Generates `totalOptions - 1` distinct hue-shift angles (in degrees) for fake shiny options
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

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case rn:
                h = (gn - bn) / d + (gn < bn ? 6 : 0);
                break;
            case gn:
                h = (bn - rn) / d + 2;
                break;
            case bn:
                h = (rn - gn) / d + 4;
                break;
        }
        h /= 6;
    }
    return [h * 360, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    const hn = ((h % 360) + 360) % 360 / 360;
    if (s === 0) {
        const v = Math.round(l * 255);
        return [v, v, v];
    }
    const hue2rgb = (p: number, q: number, t: number): number => {
        let tn = t;
        if (tn < 0) tn += 1;
        if (tn > 1) tn -= 1;
        if (tn < 1 / 6) return p + (q - p) * 6 * tn;
        if (tn < 1 / 2) return q;
        if (tn < 2 / 3) return p + (q - p) * (2 / 3 - tn) * 6;
        return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const r = Math.round(hue2rgb(p, q, hn + 1 / 3) * 255);
    const g = Math.round(hue2rgb(p, q, hn) * 255);
    const b = Math.round(hue2rgb(p, q, hn - 1 / 3) * 255);
    return [r, g, b];
}

/**
 * @brief Shifts the hue of a Pokemon sprite via HTML5 Canvas pixel manipulation
 * @param imageUrl - Source sprite URL (CORS-enabled)
 * @param hueDegrees - Hue rotation in degrees (e.g. 60, 140, 220, 290)
 * @returns Promise resolving to a `data:image/png` URL with the hue-shifted sprite
 */
export async function hueShiftImage(imageUrl: string, hueDegrees: number): Promise<string> {
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

            const w = img.width || 96;
            const h = img.height || 96;
            canvas.width = w;
            canvas.height = h;
            ctx.drawImage(img, 0, 0);

            const imgData = ctx.getImageData(0, 0, w, h);
            const data = imgData.data;

            for (let i = 0; i < data.length; i += 4) {
                const alpha = data[i + 3];
                if (alpha < 10) continue;

                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                const [hue, sat, light] = rgbToHsl(r, g, b);
                // Keep deep black outlines and pure white highlights intact while shifting body colors
                if (light <= 0.08 || light >= 0.94) continue;

                const effectiveSat = sat < 0.18 ? Math.max(sat, 0.35) : sat;
                const [nr, ng, nb] = hslToRgb(hue + hueDegrees, effectiveSat, light);
                data[i] = nr;
                data[i + 1] = ng;
                data[i + 2] = nb;
            }

            ctx.putImageData(imgData, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };

        img.onerror = () => {
            reject(new Error(`Failed to load image for hue shift: ${imageUrl}`));
        };

        img.src = imageUrl;
    });
}

