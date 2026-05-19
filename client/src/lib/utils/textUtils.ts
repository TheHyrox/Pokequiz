/**
 * @brief Text manipulation utilities
 * @description Common text processing functions for the quiz application
 */

/**
 * @brief Normalizes text for comparison
 * @description Removes accents, converts to lowercase, and trims whitespace.
 *              Useful for comparing Pokemon names regardless of accent differences.
 * @param text - The text to normalize
 * @returns Normalized text string
 * @example
 * normalizeText("Flabébé") // returns "flabebe"
 * normalizeText(" Pikachu ") // returns "pikachu"
 * normalizeText("CHARIZARD") // returns "charizard"
 */
export function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

/**
 * @brief Capitalizes the first letter of a string
 * @param text - The text to capitalize
 * @returns Text with first letter capitalized
 * @example
 * capitalizeFirst("pikachu") // returns "Pikachu"
 * capitalizeFirst("") // returns ""
 */
export function capitalizeFirst(text: string): string {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * @brief Compares two strings for equality (case and accent insensitive)
 * @param str1 - First string to compare
 * @param str2 - Second string to compare
 * @returns True if strings match after normalization
 * @example
 * stringsMatch("Flabébé", "flabebe") // returns true
 * stringsMatch("Pikachu", "pikachu") // returns true
 */
export function stringsMatch(str1: string, str2: string): boolean {
    return normalizeText(str1) === normalizeText(str2);
}

/**
 * @brief Truncates text to a maximum length with ellipsis
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 * @example
 * truncateText("A very long description", 10) // returns "A very lon..."
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
}
