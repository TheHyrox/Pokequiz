<script lang="ts">
    /**
     * @brief Hardcore mode lives display component
     * @description Shows remaining lives as heart icons for hardcore game mode
     */

    import { HARDCORE_MAX_LIVES } from '../../../shared/constants';

    /** Current lives remaining */
    export let lives: number;
    /** Maximum lives (defaults to HARDCORE_MAX_LIVES) */
    export let maxLives: number = HARDCORE_MAX_LIVES;

    $: livesArray = Array(maxLives).fill(0);
</script>

<div class="lives-container">
    {#each livesArray as _, i}
        <span
            class="life-heart"
            class:active={i < lives}
            class:lost={i >= lives}
            aria-label={i < lives ? 'Life remaining' : 'Life lost'}
        >
            {i < lives ? '❤️' : '🖤'}
        </span>
    {/each}
</div>

<style lang="postcss">
    .lives-container {
        @apply flex gap-2 text-2xl items-center;
    }

    .life-heart {
        @apply transition-all duration-300;
    }

    .life-heart.active {
        @apply transform scale-110;
        animation: heartbeat 1s ease-in-out infinite;
    }

    .life-heart.lost {
        @apply opacity-50 grayscale;
    }

    @keyframes heartbeat {
        0%, 100% {
            transform: scale(1.1);
        }
        50% {
            transform: scale(1);
        }
    }
</style>
