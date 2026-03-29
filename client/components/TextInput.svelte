<script lang="ts">
    /**
     * @brief Text input component
     * @description Styled text input with keyboard navigation support
     */
    import { createEventDispatcher } from 'svelte';

    /** Placeholder text */
    export let placeholder: string = '';
    /** Input value (two-way binding) */
    export let value: string = '';
    /** Whether input is disabled */
    export let disabled: boolean = false;
    /** Whether to auto-focus on mount */
    export let autofocus: boolean = false;

    let inputElement: HTMLInputElement;
    const dispatch = createEventDispatcher();

    /**
     * @brief Programmatically focus the input
     */
    export function focus(): void {
        inputElement?.focus();
    }

    /**
     * @brief Handles Enter key to dispatch submit event
     */
    function handleKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            dispatch('submit');
        }
    }
</script>

<!-- svelte-ignore a11y-autofocus -->
<input
    bind:this={inputElement}
    type="text"
    {placeholder}
    bind:value
    {disabled}
    {autofocus}
    on:keydown={handleKeyDown}
    on:focus
    on:blur
    on:input
    class="text-input"
/>

<style lang="postcss">
    .text-input {
        @apply w-full px-4 py-3 border-2 border-gray-300 rounded-lg;
        @apply text-lg font-medium transition-all;
    }

    .text-input:focus {
        @apply outline-none border-blue-500 ring-2 ring-blue-200;
    }

    .text-input:disabled {
        @apply bg-gray-100 cursor-not-allowed opacity-50;
    }

    .text-input::placeholder {
        @apply text-gray-400;
    }
</style>
