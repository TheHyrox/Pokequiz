/**
 * @brief Pokemon name API service
 * @description Fetches Pokemon names from PokeAPI
 */

/**
 * @brief Name entry with language information
 */
interface NameLocalized {
    name: string;
    language: string;
}

const clientNamesCache: Record<number, Promise<{ id: number; name: string }[] | null>> = {};

import { LANGUAGE_ID_TO_CODE } from '../../../shared/constants/index.js';

/**
 * @brief Fetches a single localized Pokemon name
 * @param pokemon - Pokemon ID (National Pokedex number)
 * @param languageId - PokeAPI language ID (mapped to local files)
 * @returns Localized name string or null if not found
 */
export async function getPokemonNameLocalized(pokemon: number, languageId: number): Promise<string | null> {
    if (typeof (globalThis as any).window !== 'undefined') {
        if (!clientNamesCache[languageId]) {
            clientNamesCache[languageId] = fetch(`/api/pokemon/names/${languageId}`)
                .then(async res => (res.ok ? (await res.json()) as { id: number; name: string }[] : null))
                .catch(() => null);
        }

        const list = await clientNamesCache[languageId];
        if (!list) return null;

        const entry = list.find(e => Number(e.id) === Number(pokemon));
        return entry ? entry.name : null;
    }

    try {
        const langCode = LANGUAGE_ID_TO_CODE[languageId];
        if (!langCode) return null;

        const { getServerDataDir } = await import('./utils/utils');
        const fs = await import('fs');
        const path = await import('path');

        const filePath = path.join(getServerDataDir(), 'pokemon-names', `${langCode}.json`);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            const names = JSON.parse(content) as { id: number; name: string }[];
            const entry = names.find(e => Number(e.id) === Number(pokemon));
            if (entry) return entry.name;
        }

        try {
            const res = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemon}/`);
            if (res.ok) {
                const data: any = await res.json();
                if (data && Array.isArray(data.names)) {
                    const match = data.names.find((n: any) => {
                        const langId = n.language && n.language.url && n.language.url.split('/').filter((p: string) => p).pop();
                        return langId ? parseInt(langId) === languageId : false;
                    });
                    if (match) return match.name;
                }
            }
        } catch (e) {
            console.error('Error fetching from PokeAPI:', e);
        }

        return null;
    } catch (e) {
        console.error('Error reading local pokemon names:', e);
        return null;
    }
}

/**
 * @brief Fetches all localized names for a Pokemon
 * @param pokemon - Pokemon ID (National Pokedex number)
 * @returns Array of name/language pairs or null if request fails
 * @example
 * const names = await getPokemonNames(25);
 * // returns [{ name: "Pikachu", language: "9" }, { name: "Pikachu", language: "5" }, ...]
 */
export async function getPokemonNames(pokemon: number): Promise<NameLocalized[] | null> {
    if (typeof (globalThis as any).window !== 'undefined') {
        return null;
    }

    try {
        const { getServerDataDir } = await import('./utils/utils');
        const fs = await import('fs');
        const path = await import('path');

        const dataDir = getServerDataDir();
        const folder = path.join(dataDir, 'pokemon-names');

        const result: NameLocalized[] = [];

        if (fs.existsSync(folder)) {
            const files = fs.readdirSync(folder).filter((f: string) => f.endsWith('.json'));

            for (const file of files) {
                try {
                    const content = fs.readFileSync(path.join(folder, file), 'utf-8');
                    const arr = JSON.parse(content) as { id: number; name: string }[];
                    const langCode = file.replace('.json', '');
                    const found = arr.find(e => Number(e.id) === Number(pokemon));
                    if (found) {
                        result.push({ name: found.name, language: langCode });
                    }
                } catch (e) {
                    
                }
            }
        }

        if (result.length > 0) return result;

        try {
            const res = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemon}/`);
            if (res.ok) {
                const data: any = await res.json();
                if (data && Array.isArray(data.names)) {
                    for (const n of data.names) {
                        const langIdStr = n.language && n.language.url && n.language.url.split('/').filter((p: string) => p).pop();
                        const langId = langIdStr ? parseInt(langIdStr) : undefined;
                        const langCode = langId && LANGUAGE_ID_TO_CODE[langId] ? LANGUAGE_ID_TO_CODE[langId] : (langIdStr ? langIdStr : 'unknown');
                        result.push({ name: n.name, language: langCode });
                    }
                    return result.length > 0 ? result : null;
                }
            }
        } catch (e) {
            console.error('Error fetching from PokeAPI:', e);
        }

        return null;
    } catch (e) {
        console.error('Error reading local pokemon names:', e);
        return null;
    }
}
