<script lang="ts">
    /**
     * @brief Sprite effects selector component
     * @description Configure image effects (blur, pixelate, silhouette, rotation)
     */
    import { getLabel } from '../../src/lib/translations';
    import type { SpriteEffectSettings } from '../../../shared/types';

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
                    <label class="slider-label">
                        {getLabel(languageCode, 'sprites_blurStrength')}: {effects.blurStrength}px
                    </label>
                    <input
                        type="range"
                        min="1"
                        max="10"
                        bind:value={effects.blurStrength}
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
                    <label class="slider-label">
                        {getLabel(languageCode, 'sprites_pixelateStrength')}: {effects.pixelateStrength}
                    </label>
                    <input
                        type="range"
                        min="2"
                        max="20"
                        bind:value={effects.pixelateStrength}
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

    .slider-label {
        @apply block text-sm text-gray-600;
    }

    .slider {
        @apply w-full accent-blue-500;
    }
</style>
