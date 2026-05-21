/**
 * @brief Module for loading comprehensive Pokemon data from local files
 * @description Loads Pokemon attributes, descriptions, habitats, and other data
 */

import fs from 'fs';
import path from 'path';
import { getServerDataDir } from './utils/utils.js';
import { getGenerationForPokemon } from '../../../shared/utils/pokemonUtils.js';
import { LANGUAGE_CODE_TO_ID } from '../../../shared/constants/index.js';
import { getAllPokemonNames } from './pokemonCache.js';

const DATA_DIR = getServerDataDir();

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
    const searchName = name.toLowerCase();
    
    return Object.values(allPokemon).find(p => p.name.toLowerCase() === searchName) || null;
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
 * @brief Get all Pokemon abilities for a language
 */
function getAllPokemonAbilities(language: string): { [id: string]: any } {
    const cacheKey = `pokemon-abilities:${language}`;

    if (!dataCache[cacheKey]) {
        const filePath = path.join(DATA_DIR, 'pokemon-ability', `${language}.json`);
        if (!fs.existsSync(filePath)) {
            return {};
        }

        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            dataCache[cacheKey] = JSON.parse(fileContent);
        } catch (error) {
            console.error(`Failed to load pokemon-ability/${language}.json:`, error);
            return {};
        }
    }

    return dataCache[cacheKey];
}

/**
 * @brief Get all Pokemon types for a language
 */
function getAllPokemonTypes(language: string): { [id: string]: any } {
    const cacheKey = `pokemon-types:${language}`;

    if (!dataCache[cacheKey]) {
        const filePath = path.join(DATA_DIR, 'pokemon-types', `${language}.json`);
        if (!fs.existsSync(filePath)) {
            return {};
        }

        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            dataCache[cacheKey] = JSON.parse(fileContent);
        } catch (error) {
            console.error(`Failed to load pokemon-types/${language}.json:`, error);
            return {};
        }
    }

    return dataCache[cacheKey];
}

/**
 * @brief Get all Pokemon egg groups for a language
 */
function getAllPokemonEggGroups(language: string): { [id: string]: any } {
    const cacheKey = `pokemon-egg-group:${language}`;

    if (!dataCache[cacheKey]) {
        const filePath = path.join(DATA_DIR, 'pokemon-egg-group', `${language}.json`);
        if (!fs.existsSync(filePath)) {
            return {};
        }

        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            dataCache[cacheKey] = JSON.parse(fileContent);
        } catch (error) {
            console.error(`Failed to load pokemon-egg-group/${language}.json:`, error);
            return {};
        }
    }

    return dataCache[cacheKey];
}

/**
 * @brief Get all Pokemon colors for a language
 */
function getAllPokemonColors(language: string): { [id: string]: any } {
    const cacheKey = `pokemon-colors:${language}`;

    if (!dataCache[cacheKey]) {
        const filePath = path.join(DATA_DIR, 'pokemon-colors', `${language}.json`);
        if (!fs.existsSync(filePath)) {
            return {};
        }

        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            dataCache[cacheKey] = JSON.parse(fileContent);
        } catch (error) {
            console.error(`Failed to load pokemon-colors/${language}.json:`, error);
            return {};
        }
    }

    return dataCache[cacheKey];
}

/**
 * @brief Get all Pokemon shapes for a language
 */
function getAllPokemonShapes(language: string): { [id: string]: any } {
    const cacheKey = `pokemon-shapes:${language}`;

    if (!dataCache[cacheKey]) {
        const filePath = path.join(DATA_DIR, 'pokemon-shapes', `${language}.json`);
        if (!fs.existsSync(filePath)) {
            return {};
        }

        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            dataCache[cacheKey] = JSON.parse(fileContent);
        } catch (error) {
            console.error(`Failed to load pokemon-shapes/${language}.json:`, error);
            return {};
        }
    }

    return dataCache[cacheKey];
}

/**
 * @brief Get fully localized enriched Pokemon data for Information Quiz
 * @param pokemonId Pokemon ID or name
 * @param language Language code (en, fr, de, es, it, ja, ja-hrkt, ko, zh-hans, zh-hant)
 * @returns Enriched Pokemon data with all localized attributes
 */
export async function getLocalizedEnrichedPokemon(
    pokemonId: number | string,
    language: string
): Promise<any> {
    const pokemon = getPokemonById(pokemonId);
    if (!pokemon) return null;

    // Get localized name
    const languageId = (LANGUAGE_CODE_TO_ID as any)[language];
    let localizedName = pokemon.name;
    if (languageId) {
        try {
            const names = await getAllPokemonNames(languageId);
            const nameEntry = names.find(n => String(n.id) === String(pokemon.id));
            if (nameEntry) localizedName = nameEntry.name;
        } catch (error) {
            console.warn(`Failed to fetch localized name for ${pokemon.id} in ${language}:`, error);
        }
    }

    const generationNumber = getGenerationForPokemon(pokemonId as number);
    const abilitiesData = Object.values(getAllPokemonAbilities(language)) as any[];
    const typesData = Object.values(getAllPokemonTypes(language)) as any[];
    const eggGroupsData = Object.values(getAllPokemonEggGroups(language)) as any[];
    const colorsData = Object.values(getAllPokemonColors(language)) as any[];
    const shapesData = Object.values(getAllPokemonShapes(language)) as any[];

    const abilityMap: { [key: string]: string } = {};
    const typeMap: { [key: string]: string } = {};

    abilitiesData.forEach(ability => {
        abilityMap[ability.id] = ability.localizedName || ability.name;
    });
    typesData.forEach(type => {
        typeMap[type.id] = type.localizedName || type.name;
    });

    const eggGroupNameMap: { [key: string]: string } = {};
    const colorNameMap: { [key: string]: string } = {};
    const shapeNameMap: { [key: string]: string } = {};

    eggGroupsData.forEach(eggGroup => {
        eggGroupNameMap[eggGroup.name] = eggGroup.localizedName || eggGroup.name;
    });
    colorsData.forEach(color => {
        colorNameMap[color.name] = color.localizedName || color.name;
    });
    shapesData.forEach(shape => {
        shapeNameMap[shape.name] = shape.localizedName || shape.name;
    });

    const localizedAbilities = pokemon.abilities.map((ability: any) => ({
        ...ability,
        name: abilityMap[ability.id] || ability.id
    }));

    const localizedTypes = pokemon.types.map((type: any) => ({
        ...type,
        name: typeMap[type.id] || type.id
    }));

    const localizedEggGroups = pokemon.eggGroups.map((eggGroupName: string) =>
        eggGroupNameMap[eggGroupName] || eggGroupName
    );

    const localizedColor = pokemon.color 
        ? colorNameMap[pokemon.color] || pokemon.color
        : null;

    const localizedShape = pokemon.shape 
        ? shapeNameMap[pokemon.shape] || pokemon.shape
        : null;

    let habitatId = pokemon.habitatId;
    if (!habitatId && pokemon.habitatName) {
        const enHabitats = getLocalizedDataItemsSync('habitat', 'en');
        const normalizedSearchName = normalizeHabitatName(pokemon.habitatName);
        const habitatEntry = Object.values(enHabitats).find((h: any) => 
            normalizeHabitatName(h.name) === normalizedSearchName
        ) as any;
        if (habitatEntry) {
            habitatId = habitatEntry.id;
        }
    }

    const habitatData = habitatId ? getPokemonHabitat(habitatId, language) : null;
    const habitatNameResult = habitatData ? habitatData.name : (pokemon.habitatName || null);
    const habitat = habitatNameResult ? toPascalCase(habitatNameResult) : null;
    const genusData = getPokemonGenus(pokemon.id, language);
    const category = genusData ? genusData.genus : null;

    return {
        ...pokemon,
        name: localizedName,
        generation: generationNumber,
        abilities: localizedAbilities,
        types: localizedTypes,
        eggGroups: localizedEggGroups,
        color: localizedColor,
        shape: localizedShape,
        habitat,
        category
    };
}

/**
 * @brief Normalize habitat name for comparison
 */
function normalizeHabitatName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * @brief Convert string to PascalCase
 */
function toPascalCase(str: string): string {
    return str
        .toLowerCase()
        .split(/[\s-_]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
}

/**
 * @brief Sync helper to get localized data items (used for habitat ID lookup)
 */
function getLocalizedDataItemsSync(dataType: string, language: string): { [key: string]: any } {
    const folderMap: { [key: string]: string } = {
        'habitat': 'pokemon-habitats'
    };
    const folder = folderMap[dataType] || dataType;
    const cacheKey = `${folder}:${language}`;

    if (!dataCache[cacheKey]) {
        const filePath = path.join(DATA_DIR, folder, `${language}.json`);
        if (!fs.existsSync(filePath)) return {};
        try {
            dataCache[cacheKey] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        } catch { return {}; }
    }
    return dataCache[cacheKey];
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
