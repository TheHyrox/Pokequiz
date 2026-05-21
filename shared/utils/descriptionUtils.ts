/**
 * @brief Description transformation utilities
 * @description Functions for truncating and scrambling Pokemon descriptions
 */

/**
 * @brief Truncates description by masking words
 * @param description - Original description text
 * @param strength - Truncation strength (1-3), higher = more words masked
 * @returns Description with some words replaced by blocks
 * @example
 * truncateDescription("Pikachu is a yellow mouse", 1)
 * // returns "██████ is a ██████ mouse"
 */
export function truncateDescription(description: string, strength: number): string {
    if (strength === 0) return description;

    const words = description.split(' ');
    const maskedWords = words.map((word, index) => {
        let shouldMask = false;
        if (strength === 1 && index % 4 === 0) {
            shouldMask = true;
        } else if (strength === 2 && index % 2 === 0) {
            shouldMask = true;
        } else if (strength === 3 && index % 4 !== 3) {
            shouldMask = true;
        }
        if (shouldMask) {
            return '█'.repeat(Math.max(word.length, 1));
        }
        return word;
    });
    return maskedWords.join(' ');
}

/**
 * @brief Scrambles word order in description
 * @param description - Original description text
 * @returns Description with words reordered using random algorithm
 * @description Uses one of 5 scrambling algorithms:
 * - Alphabetical order
 * - Shortest to longest
 * - Longest to shortest
 * - Most vowels first
 * - Complete random shuffle
 */
export function scrambleDescription(description: string): string {
    const words = description.split(' ');
    const algorithm = Math.floor(Math.random() * 5);
    let scrambledWords = [...words];
    
    switch (algorithm) {
        case 0: // Alphabetical order
            scrambledWords.sort((a, b) =>
                a.toLowerCase().localeCompare(b.toLowerCase())
            );
            break;

        case 1: // Shortest to longest
            scrambledWords.sort((a, b) => a.length - b.length);
            break;

        case 2: // Longest to shortest
            scrambledWords.sort((a, b) => b.length - a.length);
            break;

        case 3: // Most vowels first
            scrambledWords.sort((a, b) => {
                const vowelPattern = /[aeiouàâäæëéèêïîôöœùûüœAEIOUÀÂÄÆËÉÈÊÏÎÔÖŒÙÛÜŒ]/gi;
                const vowelsA = (a.match(vowelPattern) || []).length;
                const vowelsB = (b.match(vowelPattern) || []).length;
                return vowelsB - vowelsA;
            });
            break;

        case 4: // Fisher-Yates shuffle
            for (let i = scrambledWords.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [scrambledWords[i], scrambledWords[j]] = [scrambledWords[j], scrambledWords[i]];
            }
            break;
    }

    return scrambledWords.join(' ');
}
