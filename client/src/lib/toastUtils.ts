/**
 * @brief Toast notification utilities
 * @description Provides functions for creating and managing toast notifications
 */

import type { ToastState, ToastType } from '../../../shared/types';

// Re-export types for backward compatibility
export type { ToastState, ToastType };

/**
 * @brief Factory function to create toast handlers for a component
 * @description Creates bound handlers that update a component's toast state
 * @param onShow - Callback function to update the component's toast state
 * @returns Object containing showErrorToast, showSuccessToast, and showInfoToast functions
 * @example
 * const { showErrorToast, showSuccessToast } = createToastHandlers((state) => {
 *     toastState = state;
 * });
 * showErrorToast("Something went wrong!");
 */
export function createToastHandlers(onShow: (state: ToastState) => void) {
    return {
        /**
         * @brief Shows an error toast
         * @param message - Error message to display
         */
        showErrorToast: (message: string): void => {
            onShow({
                message,
                type: 'error',
                show: true
            });
        },

        /**
         * @brief Shows a success toast
         * @param message - Success message to display
         */
        showSuccessToast: (message: string): void => {
            onShow({
                message,
                type: 'success',
                show: true
            });
        },

        /**
         * @brief Shows an info toast
         * @param message - Info message to display
         */
        showInfoToast: (message: string): void => {
            onShow({
                message,
                type: 'info',
                show: true
            });
        }
    };
}

/**
 * @brief Creates an error toast state object
 * @param message - Error message to display
 * @returns ToastState object configured for error display
 * @example
 * toastState = createErrorToast("Failed to load data");
 */
export function createErrorToast(message: string): ToastState {
    return {
        message,
        type: 'error',
        show: true
    };
}

/**
 * @brief Creates a success toast state object
 * @param message - Success message to display
 * @returns ToastState object configured for success display
 */
export function createSuccessToast(message: string): ToastState {
    return {
        message,
        type: 'success',
        show: true
    };
}

/**
 * @brief Creates an info toast state object
 * @param message - Info message to display
 * @returns ToastState object configured for info display
 */
export function createInfoToast(message: string): ToastState {
    return {
        message,
        type: 'info',
        show: true
    };
}

/**
 * @brief Creates a hidden toast state
 * @returns ToastState object with show set to false
 */
export function createHiddenToast(): ToastState {
    return {
        message: '',
        type: 'info',
        show: false
    };
}
