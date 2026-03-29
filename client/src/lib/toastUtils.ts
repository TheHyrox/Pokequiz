export type ToastType = 'error' | 'success' | 'info';

export interface ToastState {
    message: string;
    type: ToastType;
    show: boolean;
}

/**
 * Factory function to create toast handlers for a component
 * @param onShow - Callback to update the component's toast state
 * @returns Object with showErrorToast and showSuccessToast functions
 */
export function createToastHandlers(
    onShow: (state: ToastState) => void
) {
    return {
        showErrorToast: (message: string) => {
            onShow({
                message,
                type: 'error',
                show: true
            });
        },
        showSuccessToast: (message: string) => {
            onShow({
                message,
                type: 'success',
                show: true
            });
        },
        showInfoToast: (message: string) => {
            onShow({
                message,
                type: 'info',
                show: true
            });
        }
    };
}

/**
 * Alternative approach: Direct functions that return toast state
 * Use this if you prefer a more functional style
 */
export function createErrorToast(message: string): ToastState {
    return {
        message,
        type: 'error',
        show: true
    };
}

export function createSuccessToast(message: string): ToastState {
    return {
        message,
        type: 'success',
        show: true
    };
}

export function createInfoToast(message: string): ToastState {
    return {
        message,
        type: 'info',
        show: true
    };
}
