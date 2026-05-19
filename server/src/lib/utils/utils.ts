/**
 * @brief Server-side utility functions for Pokemon quiz logic
 * @description Provides random Pokemon selection, generation mapping, and server data path helpers
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generationToId, getRandomInt, getRandomPokemonId } from '../../../../shared/utils/pokemonUtils.js';

export { generationToId, getRandomInt, getRandomPokemonId };

/**
 * @brief Resolves the server data directory in both source and compiled runtimes
 * @returns First existing data directory, or the preferred source path if none exist
 */
export function getServerDataDir(): string {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const DATA_DIR_CANDIDATES = [
        path.resolve(process.cwd(), 'server', 'src', 'data'),
        path.resolve(process.cwd(), 'server', 'dist', 'server', 'src', 'data'),
        path.join(__dirname, '../../data'),
        path.join(__dirname, '../../../data')
    ];

    for (const candidate of DATA_DIR_CANDIDATES) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    return DATA_DIR_CANDIDATES[0];
}

