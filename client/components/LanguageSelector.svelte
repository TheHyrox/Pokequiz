<script lang="ts">
    import { LANGUAGES, getLabel } from '../src/lib/translations';
    
    export let selectedLanguageId: number;
    export let currentLanguageCode: string;
</script>

<div class="language-selector">
    <label for="language-select" class="language-label">
        {getLabel(currentLanguageCode, 'language')}:
    </label>
    <select 
        id="language-select"
        bind:value={selectedLanguageId}
        class="language-select"
    >
        {#each LANGUAGES as lang (lang.id)}
            <option value={lang.id}>
                {lang.nativeName}
            </option>
        {/each}
    </select>
</div>

<style lang="postcss">
    .language-selector {
        @apply flex items-center gap-2 sm:gap-3;
    }

    .language-label {
        @apply hidden sm:inline font-medium text-gray-700 text-sm sm:text-base;
    }

    .language-select {
        @apply px-2.5 py-1.5 sm:px-3 sm:py-2 border border-gray-300 rounded-lg;
        @apply bg-white text-gray-800 font-medium text-sm sm:text-base;
        @apply transition-all duration-200;
        @apply cursor-pointer max-w-[130px] sm:max-w-none truncate;
    }

    .language-select:hover {
        @apply border-blue-400 shadow-md;
    }

    .language-select:focus {
        @apply outline-none border-blue-500 ring-2 ring-blue-200;
    }
</style>
