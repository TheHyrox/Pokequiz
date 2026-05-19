<script lang="ts">
    /**
     * @brief Game mode selector component
     * @description Radio button group for selecting quiz game modes
     */
    import { getLabel } from '../../src/lib/translations';
    import type { GameMode } from '../../../shared/types';
    import type { LabelKey } from '../../src/lib/i18n/types';

    /** Current language code for translations */
    export let languageCode: string;
    /** Currently selected game mode (two-way binding) */
    export let gameMode: GameMode;

    const modes: Array<{ value: GameMode; labelKey: LabelKey; descKey: LabelKey }> = [
        { value: 'score', labelKey: 'scoreMode', descKey: 'scoreFirst' },
        { value: 'infinite', labelKey: 'infiniteMode', descKey: 'continueUntilWrong' },
        { value: 'challenge', labelKey: 'challengeMode', descKey: 'tenQuestionsChallenge' },
        { value: 'hardcore', labelKey: 'hardcoreMode', descKey: 'typeThePokemonName' }
    ];
</script>

<div class="settings-section">
    <h3 class="settings-section-title">{getLabel(languageCode, 'gameMode')}</h3>
    <p class="section-description">{getLabel(languageCode, 'gameModeDescription')}</p>
    <div class="game-mode-options">
        {#each modes as mode (mode.value)}
            <label class="radio-label">
                <input
                    type="radio"
                    name="gameMode"
                    value={mode.value}
                    bind:group={gameMode}
                    class="radio-input"
                />
                <span class="radio-text">{getLabel(languageCode, mode.labelKey)}</span>
                <span class="radio-description">{getLabel(languageCode, mode.descKey)}</span>
            </label>
        {/each}
    </div>
</div>

<style lang="postcss">
    .settings-section {
        @apply mb-8;
    }

    .settings-section-title {
        @apply text-lg font-semibold text-gray-700 mb-2;
    }

    .section-description {
        @apply text-sm text-gray-600 mb-4 italic;
    }

    .game-mode-options {
        @apply space-y-3;
    }

    .radio-label {
        @apply flex flex-col p-3 border-2 border-gray-200 rounded-lg cursor-pointer transition-all;
    }

    .radio-label:hover {
        @apply border-blue-400 bg-blue-50;
    }

    .radio-label:has(input:checked) {
        @apply border-blue-500 bg-blue-50;
    }

    .radio-input {
        @apply w-4 h-4 accent-blue-500 cursor-pointer mb-2;
    }

    .radio-text {
        @apply font-medium text-gray-700;
    }

    .radio-description {
        @apply text-sm text-gray-500 mt-1;
    }
</style>
