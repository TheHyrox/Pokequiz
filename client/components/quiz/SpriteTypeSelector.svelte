<script lang="ts">
    /**
     * @brief Sprite type selector component
     * @description Toggle between front and back sprite views
     */
    import { getLabel } from '../../src/lib/translations';
    import type { SpriteType } from '../../../shared/types';

    /** Current selected sprite types */
    export let selectedSpriteTypes: SpriteType[] = ['front'];
    /** Language code for labels */
    export let languageCode: string = 'en';

    /**
     * @brief Toggle a sprite type
     */
    function toggleSpriteType(type: SpriteType): void {
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
        
        <label class="checkbox-label">
            <input
                type="checkbox"
                checked={selectedSpriteTypes.includes('back')}
                on:change={() => toggleSpriteType('back')}
            />
            <span>{getLabel(languageCode, 'sprites_back')}</span>
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

    .checkbox-label input {
        @apply mr-3 w-4 h-4 accent-blue-600;
    }

    .checkbox-label span {
        @apply text-gray-700;
    }
</style>
