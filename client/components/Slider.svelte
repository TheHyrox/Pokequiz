<script lang="ts">
    export let label: string;
    export let min: number;
    export let max: number;
    export let value: number;

    function handleChange(e: Event) {
        const target = e.target as HTMLInputElement;
        value = parseInt(target.value);
    }
</script>

<div class="slider-container">
    <label for="slider" class="slider-label">
        {label}: <span class="slider-value">{value}</span>
    </label>
    <input
        id="slider"
        type="range"
        {min}
        {max}
        bind:value
        on:change={handleChange}
        class="slider-input"
    />
</div>

<style lang="postcss">
    .slider-container {
        @apply flex flex-col gap-2 mb-4;
    }

    .slider-label {
        @apply font-medium text-gray-700;
    }

    .slider-value {
        @apply font-bold text-blue-600;
    }

    .slider-input {
        @apply w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer;
        @apply accent-blue-500;
    }

    .slider-input:hover {
        @apply bg-gray-300;
    }
</style>
