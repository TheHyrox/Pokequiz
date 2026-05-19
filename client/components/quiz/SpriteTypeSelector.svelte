<script lang="ts">
    /**
     * @brief Sprite type selector component
     * @description Toggle between front and back sprite views
     */
    import { getLabel } from '../../src/lib/translations';
    import type { SpriteType, SpriteSource } from '../../../shared/types';

    /** Current selected sprite types */
    export let selectedSpriteTypes: SpriteType[] = ['front'];
    /** Language code for labels */
    export let languageCode: string = 'en';
    /** Current sprite source (back sprites only available for 'default') */
    export let spriteSource: SpriteSource = 'home';

    /**
     * @brief Reactive declaration - check if back sprites option is disabled
     */
    $: isBackDisabled = spriteSource !== 'default';

    /**
     * @brief Toggle a sprite type
     */
    function toggleSpriteType(type: SpriteType): void {
        if (type === 'back' && isBackDisabled) {
            return;
        }

        if (selectedSpriteTypes.includes(type)) {
            // Only allow deselect if at least one remains selected
            if (selectedSpriteTypes.length > 1) {
                selectedSpriteTypes = selectedSpriteTypes.filter(t => t !== type);
            }
        } else {
            selectedSpriteTypes = [...selectedSpriteTypes, type];
        }
    }
</script>

<div class="sprite-type-selector">
    <label class="section-label">{getLabel(languageCode, 'sprites_spriteTypesHeader')}</label>
    <p class="section-description">{getLabel(languageCode, 'sprites_spriteTypesDescription')}</p>
    
    <div class="checkbox-group">
        <label class="checkbox-label">
            <input
                type="checkbox"
                checked={selectedSpriteTypes.includes('front')}
                on:change={() => toggleSpriteType('front')}
            />
            <span>{getLabel(languageCode, 'sprites_front')}</span>
        </label>
        
        <label class="checkbox-label" class:disabled={isBackDisabled}>
            <input
                type="checkbox"
                checked={selectedSpriteTypes.includes('back')}
                on:change={() => toggleSpriteType('back')}
                disabled={isBackDisabled}
            />
            <span>{getLabel(languageCode, 'sprites_back')}</span>
            {#if isBackDisabled}
                <span class="disabled-hint">{getLabel(languageCode, 'sprites_backOnlyDefault')}</span>
            {/if}
        </label>
    </div>
</div>

<style lang="postcss">
    .sprite-type-selector {
        @apply mb-6;
    }

    .section-label {
        @apply block text-lg font-semibold text-gray-800 mb-2;
    }

    .section-description {
        @apply text-sm text-gray-600 mb-4;
    }

    .checkbox-group {
        @apply space-y-2;
    }

    .checkbox-label {
        @apply flex items-center cursor-pointer;
    }

    .checkbox-label.disabled {
        @apply opacity-60 cursor-not-allowed;
    }

    .checkbox-label input {
        @apply mr-3 w-4 h-4 accent-blue-600;
    }

    .checkbox-label input:disabled {
        @apply cursor-not-allowed;
    }

    .checkbox-label span {
        @apply text-gray-700;
    }

    .checkbox-label.disabled span {
        @apply text-gray-500;
    }

    .disabled-hint {
        @apply ml-2 text-xs text-gray-500 italic;
    }
</style>
