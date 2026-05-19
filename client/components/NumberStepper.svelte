<script lang="ts">
    /**
     * @brief Number stepper/nudger component for integer input
     * @description Input field with increment/decrement buttons for numeric values
     */

    /** Minimum allowed value */
    export let min: number = 1;
    /** Maximum allowed value */
    export let max: number = 25;
    /** Current value (two-way binding) */
    export let value: number = 4;
    /** Label text */
    export let label: string = '';
    /** Placeholder text */
    export let placeholder: string = '';

    let inputElement: HTMLInputElement;

    /**
     * @brief Increment value by 1
     */
    function increment(): void {
        const newValue = Math.min(value + 1, max);
        value = newValue;
    }

    /**
     * @brief Decrement value by 1
     */
    function decrement(): void {
        const newValue = Math.max(value - 1, min);
        value = newValue;
    }

    /**
     * @brief Handle direct input and validate
     */
    function handleInput(event: Event): void {
        const target = event.target as HTMLInputElement;
        let inputValue = target.value;

        // Allow empty string while typing
        if (inputValue === '') {
            value = '';
            return;
        }

        // Parse as integer
        let numValue = parseInt(inputValue, 10);

        // If not a valid number, revert
        if (isNaN(numValue)) {
            target.value = value.toString();
            return;
        }

        // Clamp to min/max bounds
        numValue = Math.max(min, Math.min(numValue, max));
        value = numValue;
        target.value = numValue.toString();
    }

    /**
     * @brief Handle blur to ensure valid value
     */
    function handleBlur(): void {
        if (value === '' || isNaN(value as any)) {
            value = min;
        } else {
            value = Math.max(min, Math.min(value as any, max));
        }

        if (inputElement) {
            inputElement.value = value.toString();
        }
    }

    /**
     * @brief Handle keyboard input to allow only numbers
     */
    function handleKeyDown(event: KeyboardEvent): void {
        const key = event.key;

        // Allow arrow keys, backspace, delete, tab
        if (['ArrowUp', 'ArrowDown', 'Backspace', 'Delete', 'Tab'].includes(key)) {
            if (key === 'ArrowUp') {
                event.preventDefault();
                increment();
            } else if (key === 'ArrowDown') {
                event.preventDefault();
                decrement();
            }
            return;
        }

        // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        if (event.ctrlKey || event.metaKey) {
            return;
        }

        // Allow only numeric keys
        if (!/[0-9]/.test(key)) {
            event.preventDefault();
        }
    }
</script>

<div class="stepper-container">
    {#if label}
        <label class="stepper-label">{label}</label>
    {/if}
    <div class="stepper-input-group">
        <input
            bind:this={inputElement}
            type="text"
            inputmode="numeric"
            bind:value
            {placeholder}
            on:input={handleInput}
            on:blur={handleBlur}
            on:keydown={handleKeyDown}
            class="stepper-input"
        />
        <div class="stepper-buttons">
            <button
                type="button"
                on:click={increment}
                disabled={value >= max}
                class="stepper-btn stepper-btn-up"
                aria-label="Increment"
            >
                ▲
            </button>
            <button
                type="button"
                on:click={decrement}
                disabled={value <= min}
                class="stepper-btn stepper-btn-down"
                aria-label="Decrement"
            >
                ▼
            </button>
        </div>
    </div>
</div>

<style lang="postcss">
    .stepper-container {
        @apply flex flex-col gap-2;
    }

    .stepper-label {
        @apply text-sm font-medium text-gray-700;
    }

    .stepper-input-group {
        @apply relative flex items-center;
    }

    .stepper-input {
        @apply w-full px-4 py-2 pr-12 border-2 border-gray-300 rounded-lg;
        @apply text-lg font-medium text-center transition-all;
    }
    
    .stepper-input:focus {
        @apply outline-none border-blue-500 ring-2 ring-blue-200;
    }

    .stepper-input:disabled {
        @apply bg-gray-100 cursor-not-allowed opacity-50;
    }

    .stepper-buttons {
        @apply absolute right-1 flex flex-col gap-0;
    }

    .stepper-btn {
        @apply w-8 h-5 flex items-center justify-center rounded;
        @apply text-xs font-bold text-blue-600 border border-blue-300;
        @apply transition-all cursor-pointer;
    }

    .stepper-btn:hover {
        @apply bg-blue-50 border-blue-500;
    }

    .stepper-btn:disabled {
        @apply text-gray-300 border-gray-200 bg-gray-50 cursor-not-allowed;
    }

    .stepper-btn:active {
        @apply bg-blue-100;
    }

    .stepper-btn-up {
        @apply rounded-b-none border-b-0;
    }

    .stepper-btn-down {
        @apply rounded-t-none;
    }
</style>
