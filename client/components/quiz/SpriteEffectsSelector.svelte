<script lang="ts">
    /**
     * @brief Sprite effects selector component
     * @description Configure image effects (blur, pixelate, silhouette, rotation)
     */
    import { getLabel } from '../../src/lib/translations';
    import { getBlurLimits, getPixelateLimits, getRecommendedBlur, getRecommendedPixelate, clampValue } from '../../src/lib/utils/spriteEffectLimits';
    import type { SpriteEffectSettings, SpriteType, SpriteSource } from '../../../shared/types';

    /** Current effect settings */
    export let effects: SpriteEffectSettings = {
        blurEnabled: true,
        blurStrength: 5,
        pixelateEnabled: false,
        pixelateStrength: 10,
        silhouetteEnabled: false,
        rotationEnabled: false
    };
    /** Language code for labels */
    export let languageCode: string = 'en';
    /** Current sprite source for effect limits */
    export let spriteSource: SpriteSource = 'home';
    /** Selected sprite types for effect limits */
    export let selectedSpriteTypes: SpriteType[] = ['front'];

    /**
     * @brief Track silhouette state separately to avoid circular dependency
     */
    let silhouetteEnabled = false;
    $: silhouetteEnabled = effects.silhouetteEnabled;

    /**
     * @brief Reactive blur limits based on current settings
     */
    let blurLimits: ReturnType<typeof getBlurLimits>;
    $: blurLimits = getBlurLimits(selectedSpriteTypes, spriteSource, silhouetteEnabled);

    /**
     * @brief Reactive pixelate limits based on current settings
     */
    let pixelateLimits: ReturnType<typeof getPixelateLimits>;
    $: pixelateLimits = getPixelateLimits(selectedSpriteTypes, spriteSource, silhouetteEnabled);

    /**
     * @brief Reactive recommended blur value based on active effects
     */
    let recommendedBlur: number;
    $: recommendedBlur = getRecommendedBlur(selectedSpriteTypes, spriteSource, effects.blurEnabled, effects.pixelateEnabled, effects.silhouetteEnabled);

    /**
     * @brief Reactive recommended pixelate value based on active effects
     */
    let recommendedPixelate: number;
    $: recommendedPixelate = getRecommendedPixelate(selectedSpriteTypes, spriteSource, effects.blurEnabled, effects.pixelateEnabled, effects.silhouetteEnabled);

    /**
     * @brief Handle blur strength change
     */
    function handleBlurChange() {
        effects.blurStrength = clampValue(effects.blurStrength, blurLimits.min, blurLimits.max);
    }

    /**
     * @brief Handle pixelate strength change
     */
    function handlePixelateChange() {
        effects.pixelateStrength = clampValue(effects.pixelateStrength, pixelateLimits.min, pixelateLimits.max);
    }
</script>

<div class="sprite-effects-selector">
    <label class="section-label">{getLabel(languageCode, 'sprites_imageEffects')}</label>
    <p class="section-description">{getLabel(languageCode, 'sprites_imageEffectsDescription')}</p>
    
    <div class="effects-container">
        <!-- Blur Effect -->
        <div class="effect-group">
            <label class="checkbox-label">
                <input
                    type="checkbox"
                    bind:checked={effects.blurEnabled}
                />
                <span>{getLabel(languageCode, 'sprites_blurEffect')}</span>
            </label>
            {#if effects.blurEnabled}
                <div class="slider-container">
                    <div class="slider-header">
                        <label class="slider-label">
                            {getLabel(languageCode, 'sprites_blurStrength')}: {effects.blurStrength}px
                        </label>
                        <span class="recommended-tag">
                            {getLabel(languageCode, 'sprites_recommended')}: {recommendedBlur}px
                        </span>
                    </div>
                    <input
                        type="range"
                        min={blurLimits.min}
                        max={blurLimits.max}
                        bind:value={effects.blurStrength}
                        on:change={handleBlurChange}
                        class="slider"
                    />
                </div>
            {/if}
        </div>

        <!-- Pixelate Effect -->
        <div class="effect-group">
            <label class="checkbox-label">
                <input
                    type="checkbox"
                    bind:checked={effects.pixelateEnabled}
                />
                <span>{getLabel(languageCode, 'sprites_pixelateEffect')}</span>
            </label>
            {#if effects.pixelateEnabled}
                <div class="slider-container">
                    <div class="slider-header">
                        <label class="slider-label">
                            {getLabel(languageCode, 'sprites_pixelateStrength')}: {effects.pixelateStrength}
                        </label>
                        <span class="recommended-tag">
                            {getLabel(languageCode, 'sprites_recommended')}: {recommendedPixelate}
                        </span>
                    </div>
                    <input
                        type="range"
                        min={pixelateLimits.min}
                        max={pixelateLimits.max}
                        bind:value={effects.pixelateStrength}
                        on:change={handlePixelateChange}
                        class="slider"
                    />
                </div>
            {/if}
        </div>

        <!-- Silhouette Effect -->
        <div class="effect-group">
            <label class="checkbox-label">
                <input
                    type="checkbox"
                    bind:checked={effects.silhouetteEnabled}
                />
                <span>{getLabel(languageCode, 'sprites_silhouetteEffect')}</span>
            </label>
        </div>

        <!-- Rotation Effect -->
        <div class="effect-group">
            <label class="checkbox-label">
                <input
                    type="checkbox"
                    bind:checked={effects.rotationEnabled}
                />
                <span>{getLabel(languageCode, 'sprites_rotationEffect')}</span>
            </label>
        </div>
    </div>
</div>

<style lang="postcss">
    .sprite-effects-selector {
        @apply mb-6;
    }

    .section-label {
        @apply block text-lg font-semibold text-gray-800 mb-2;
    }

    .section-description {
        @apply text-sm text-gray-600 mb-4;
    }

    .effects-container {
        @apply space-y-4 bg-gray-50 p-4 rounded-lg;
    }

    .effect-group {
        @apply space-y-2;
    }

    .checkbox-label {
        @apply flex items-center cursor-pointer;
    }

    .checkbox-label input {
        @apply mr-3 w-4 h-4 accent-blue-600;
    }

    .checkbox-label span {
        @apply text-gray-700 font-medium;
    }

    .slider-container {
        @apply ml-7 space-y-2;
    }

    .slider-header {
        @apply flex justify-between items-center;
    }

    .slider-label {
        @apply block text-sm text-gray-600;
    }

    .recommended-tag {
        @apply text-xs text-blue-600 font-semibold;
    }

    .slider {
        @apply w-full accent-blue-500;
    }
</style>
