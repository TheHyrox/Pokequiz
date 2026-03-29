<script lang="ts">
    export let message: string;
    export let type: 'error' | 'success' | 'info' = 'info';
    export let onClose: () => void = () => {};
    export let autoClose: boolean = true;
    export let duration: number = 3000;

    let show = true;

    if (autoClose) {
        setTimeout(() => {
            show = false;
            onClose();
        }, duration);
    }

    function handleClose() {
        show = false;
        onClose();
    }
</script>

{#if show}
    <div class={`toast toast-${type}`}>
        <p class="toast-message">{message}</p>
        <button on:click={handleClose} class="toast-close">×</button>
    </div>
{/if}

<style lang="postcss">
    .toast {
        @apply fixed bottom-6 left-6 px-6 py-4 rounded-lg shadow-lg max-w-sm;
        @apply flex items-center justify-between gap-4 animate-slideIn;
        z-index: 9999;
    }

    .toast-error {
        @apply bg-red-500 text-white;
    }

    .toast-success {
        @apply bg-green-500 text-white;
    }

    .toast-info {
        @apply bg-blue-500 text-white;
    }

    .toast-message {
        @apply flex-1 font-medium;
    }

    .toast-close {
        @apply text-white text-2xl font-bold transition-opacity;
        @apply bg-none border-none cursor-pointer p-0;
    }

    .toast-close:hover {
        @apply opacity-70;
    }

    @keyframes slideIn {
        from {
            transform: translateX(-100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(-100%);
            opacity: 0;
        }
    }

    :global(.animate-slideIn) {
        animation: slideIn 0.3s ease-out;
    }
</style>
