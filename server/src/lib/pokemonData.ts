/**
 * @brief Module for loading comprehensive Pokemon data from local files
 * @description Loads Pokemon attributes, descriptions, habitats, and other data
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../data');

// Cache for loaded data
const dataCache: { [key: string]: any } = {};

export interface Ability {
    id: string | number;
    isHidden: boolean;
}

export interface Type {
    slot: number;
    id: string | number;
}

export interface PokemonEntry {
    id: number | string;
    name: string;
    locationAreaEncounters: string | null;
    height: number | null;
    weight: number | null;
    color: string | null;
    eggGroups: string[];
    generationId: number | null;
    habitatId: number | null;
    habitatName: string | null;
    shape: string | null;
    evolutionChain: string | null;
    abilities: Ability[];
    types: Type[];
}

export interface FlavorTextEntry {
    text: string;
    version: string;
}

export interface PokemonDescription {
    name: string;
    descriptions: FlavorTextEntry[];
    genus?: string;
}

export interface PokemonHabitat {
    id: number;
    name: string;
}

export interface PokemonGenus {
    id: string | number;
    genus: string;
}

/**
 * @brief Get all Pokemon data
 */
export function getAllPokemon(): { [id: string]: PokemonEntry } {
    const cacheKey = 'pokemon:all';

    if (!dataCache[cacheKey]) {
        const filePath = path.join(DATA_DIR, 'pokemon.json');
        if (!fs.existsSync(filePath)) {
            console.warn(`File not found: ${filePath}`);
            return {};
        }

        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            dataCache[cacheKey] = JSON.parse(fileContent);
        } catch (error) {
            console.error(`Failed to load pokemon.json:`, error);
            return {};
        }
    }

    return dataCache[cacheKey];
}

/**
 * @brief Get Pokemon by ID
 */
export function getPokemonById(id: number | string): PokemonEntry | null {
    const allPokemon = getAllPokemon();
    return allPokemon[id] || null;
}

/**
 * @brief Search Pokemon by name
 */
export function searchPokemonByName(name: string): PokemonEntry | null {
    const allPokemon = getAllPokemon();
    const lowerName = name.toLowerCase();
    
    for (const [_, pokemon] of Object.entries(allPokemon)) {
        if (pokemon.name.toLowerCase() === lowerName) {
            return pokemon;
        }
    }
    
    return null;
}

/**
 * @brief Get Pokemon description by ID and language
 */
export function getPokemonDescription(
    pokemonId: number | string,
    language: string
): PokemonDescription | null {
    const cacheKey = `pokemon-descriptions:${language}`;

    if (!dataCache[cacheKey]) {
        const filePath = path.join(DATA_DIR, 'pokemon-descriptions', `${language}.json`);
        if (!fs.existsSync(filePath)) {
            console.warn(`File not found: ${filePath}`);
            return null;
        }

        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            dataCache[cacheKey] = JSON.parse(fileContent);
        } catch (error) {
            console.error(`Failed to load pokemon-descriptions/${language}.json:`, error);
            return null;
        }
    }

    const data = dataCache[cacheKey];
    return data[pokemonId] || null;
}

/**
 * @brief Get all Pokemon descriptions for a language
 */
export function getAllPokemonDescriptions(language: string): { [id: string]: PokemonDescription } {
    const cacheKey = `pokemon-descriptions:${language}`;

    if (!dataCache[cacheKey]) {
        const filePath = path.join(DATA_DIR, 'pokemon-descriptions', `${language}.json`);
        if (!fs.existsSync(filePath)) {
            return {};
        }

        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            dataCache[cacheKey] = JSON.parse(fileContent);
        } catch (error) {
            console.error(`Failed to load pokemon-descriptions/${language}.json:`, error);
            return {};
        }
    }

    return dataCache[cacheKey];
}

/**
 * @brief Get habitat information by ID and language
 */
export function getPokemonHabitat(
    habitatId: number | string,
    language: string
): PokemonHabitat | null {
    const cacheKey = `pokemon-habitats:${language}`;

    if (!dataCache[cacheKey]) {
        const filePath = path.join(DATA_DIR, 'pokemon-habitats', `${language}.json`);
        if (!fs.existsSync(filePath)) {
            return null;
        }

        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            dataCache[cacheKey] = JSON.parse(fileContent);
        } catch (error) {
            console.error(`Failed to load pokemon-habitats/${language}.json:`, error);
            return null;
        }
    }

    const data = dataCache[cacheKey];
    return data[habitatId] || null;
}

/**
 * @brief Get enriched Pokemon data with descriptions and habitat
 */
export function getEnrichedPokemon(
    pokemonId: number | string,
    language: string
): any {
    const pokemon = getPokemonById(pokemonId);
    if (!pokemon) return null;

    const description = getPokemonDescription(pokemonId, language);
    const habitat = pokemon.habitatId ? getPokemonHabitat(pokemon.habitatId, language) : null;

    return {
        ...pokemon,
        description,
        habitat
    };
}

/**
 * @brief Get Pokemon genus by ID and language
 */
export function getPokemonGenus(
    pokemonId: number | string,
    language: string
): PokemonGenus | null {
    const cacheKey = `pokemon-genera:${language}`;

    if (!dataCache[cacheKey]) {
        const filePath = path.join(DATA_DIR, 'pokemon-genera', `${language}.json`);
        if (!fs.existsSync(filePath)) {
            return null;
        }

        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            dataCache[cacheKey] = JSON.parse(fileContent);
        } catch (error) {
            console.error(`Failed to load pokemon-genera/${language}.json:`, error);
            return null;
        }
    }

    const data = dataCache[cacheKey];
    return data[pokemonId] || null;
}

/**
 * @brief Get all Pokemon genera for a language
 */
export function getAllPokemonGenera(language: string): { [id: string]: PokemonGenus } {
    const cacheKey = `pokemon-genera:${language}`;

    if (!dataCache[cacheKey]) {
        const filePath = path.join(DATA_DIR, 'pokemon-genera', `${language}.json`);
        if (!fs.existsSync(filePath)) {
            return {};
        }

        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            dataCache[cacheKey] = JSON.parse(fileContent);
        } catch (error) {
            console.error(`Failed to load pokemon-genera/${language}.json:`, error);
            return {};
        }
    }

    return dataCache[cacheKey];
}
