import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface Pokemon {
    id: number;
    name: string;
}

const LANGUAGE_ID_TO_CODE: Record<number, string> = {
    1: 'ja-hrkt',
    3: 'ko',
    4: 'zh-hant',
    5: 'fr',
    6: 'de',
    7: 'es',
    8: 'it',
    9: 'en',
    11: 'ja',
    12: 'zh-hans'
};

let pokemonCache: Record<string, Pokemon[]> = {};

export async function getAllPokemonNames(languageId: number): Promise<Pokemon[]> {
    const langCode = LANGUAGE_ID_TO_CODE[languageId];
    
    if (!langCode) {
        throw new Error(`Invalid language ID: ${languageId}`);
    }

    if (pokemonCache[langCode]) {
        return pokemonCache[langCode];
    }

    const filePath = path.join(__dirname, '../data/pokemon-names', `${langCode}.json`);
    
    if (!fs.existsSync(filePath)) {
        throw new Error(`Pokemon names file not found for language: ${langCode}. Path: ${filePath}`);
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const pokemonList = JSON.parse(fileContent) as Pokemon[];

    pokemonCache[langCode] = pokemonList;
    
    return pokemonList;
}
