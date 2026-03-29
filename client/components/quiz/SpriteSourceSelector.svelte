<script lang="ts">
    /**
     * @brief Sprite source selector component
     * @description Select sprite quality/style (default, home, official)
     */
    import { getLabel } from '../../src/lib/translations';
    import type { SpriteSource } from '../../../shared/types';

    /** Currently selected sprite source */
    export let spriteSource: SpriteSource = 'home';
    /** Language code for labels */
    export let languageCode: string = 'en';

    const sources: SpriteSource[] = ['default', 'home', 'official'];

    /**
     * @brief Get label for sprite source
     */
    function getSourceLabel(source: SpriteSource): string {
        const sourceKeyMap: Record<SpriteSource, string> = {
            'default': 'sprites_default',
            'home': 'sprites_home',
            'official': 'sprites_official'
        };
        return getLabel(languageCode, sourceKeyMap[source] as any);
    }
</script>

<div class="sprite-source-selector">
    <label class="section-label">{getLabel(languageCode, 'sprites_spriteSourceHeader')}</label>
    <p class="section-description">{getLabel(languageCode, 'sprites_spriteSourceDescription')}</p>
    
    <div class="radio-group">
        {#each sources as source (source)}
            <label class="radio-label">
                <input
                    type="radio"
                    bind:group={spriteSource}
                    value={source}
                />
                <span>{getSourceLabel(source)}</span>
            </label>
        {/each}
    </div>
</div>

<style lang="postcss">
    .sprite-source-selector {
        @apply mb-6;
    }

    .section-label {
        @apply block text-lg font-semibold text-gray-800 mb-2;
    }

    .section-description {
        @apply text-sm text-gray-600 mb-4;
    }

    .radio-group {
        @apply space-y-2;
    }

    .radio-label {
        @apply flex items-center cursor-pointer;
    }

    .radio-label input {
        @apply mr-3 w-4 h-4 accent-blue-600;
    }

    .radio-label span {
        @apply text-gray-700;
    }
</style>
