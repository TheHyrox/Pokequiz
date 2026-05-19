<script lang="ts">
    export let label: string;
    export let enabled: boolean = false;
</script>

<div class="toggle-option">
    <label class="toggle-label">
        <input
            type="checkbox"
            bind:checked={enabled}
            class="toggle-input"
        />
        <span class="toggle-text">{label}</span>
    </label>
</div>

<style lang="postcss">
    .toggle-option {
        @apply mb-3;
    }

    .toggle-label {
        @apply flex items-center cursor-pointer gap-3;
    }

    .toggle-input {
        @apply w-5 h-5 accent-blue-500 cursor-pointer;
    }

    .toggle-text {
        @apply font-medium text-gray-700;
    }

    .toggle-label:hover .toggle-text {
        @apply text-blue-600;
    }
</style>
