<script lang="ts">
    /**
     * @brief Timer display component
     * @description Shows countdown timer with danger animation when time is low
     */

    /** Time remaining in seconds */
    export let timeRemaining: number;
    /** Threshold below which danger styling is shown */
    export let dangerThreshold: number = 5;

    $: isDanger = timeRemaining <= dangerThreshold;
</script>

<div class="timer-container">
    <div class="timer-display" class:timer-danger={isDanger}>
        {timeRemaining}s
    </div>
</div>

<style lang="postcss">
    .timer-container {
        @apply mb-6 text-center;
    }

    .timer-display {
        @apply text-6xl font-bold text-blue-600 p-4 bg-blue-100 rounded-lg inline-block;
    }

    .timer-danger {
        @apply text-red-600 bg-red-100;
        animation: pulse 0.5s infinite;
    }

    @keyframes pulse {
        0%, 100% {
            opacity: 1;
        }
        50% {
            opacity: 0.7;
        }
    }
</style>
