<script lang="ts">
    export let placeholder: string = '';
    export let value: string = '';
    export let disabled: boolean = false;
    export let autofocus: boolean = false;

    let inputElement: HTMLInputElement;

    export function focus() {
        inputElement?.focus();
    }

    function handleKeyDown(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            dispatch('submit');
        }
    }

    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
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
