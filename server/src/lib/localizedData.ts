/**
 * @brief Module for loading localized Pokemon data from local files
 * @description Loads ability, egg-group, color, shape, and type data from local JSON files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../data');

// Cache for loaded data
const dataCache: { [key: string]: any } = {};

/**
 * @brief Get localized name for a resource
 * @param dataType Type of data (ability, egg-group, pokemon-color, pokemon-shape, type)
 * @param resourceName Name of the resource (e.g., "static", "run-away")
 * @param language Language code (en, fr, de, es, it, ja, ja-hrkt, ko, zh-hans, zh-hant)
 */
export function getLocalizedName(
    dataType: string,
    resourceName: string,
    language: string
): string | null {
    const folderMap: { [key: string]: string } = {
        'ability': 'pokemon-ability',
        'egg-group': 'pokemon-egg-group',
        'pokemon-color': 'pokemon-colors',
        'pokemon-shape': 'pokemon-shapes',
        'type': 'pokemon-types'
    };

    const folder = folderMap[dataType];
    if (!folder) return null;

    const cacheKey = `${folder}:${language}`;

    // Load data from cache or file
    if (!dataCache[cacheKey]) {
        const filePath = path.join(DATA_DIR, folder, `${language}.json`);
        if (!fs.existsSync(filePath)) {
            console.warn(`File not found: ${filePath}`);
            return null;
        }

        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            dataCache[cacheKey] = JSON.parse(fileContent);
        } catch (error) {
            console.error(`Failed to load ${folder}/${language}.json:`, error);
            return null;
        }
    }

    const data = dataCache[cacheKey];
    
    // Search through all entries looking for a name match
    for (const [_id, entry] of Object.entries(data)) {
        const entryData = entry as any;
        if (entryData.name === resourceName) {
            return entryData.localizedName || entryData.name || null;
        }
    }
    
    console.warn(`Resource not found: ${dataType}/${resourceName}/${language}`);
    return null;
}

/**
 * @brief Get all localized names for a resource type and language
 */
export function getLocalizedData(
    dataType: string,
    language: string
): { [key: string]: any } {
    const folderMap: { [key: string]: string } = {
        'ability': 'pokemon-ability',
        'egg-group': 'pokemon-egg-group',
        'pokemon-color': 'pokemon-colors',
        'pokemon-shape': 'pokemon-shapes',
        'type': 'pokemon-types'
    };

    const folder = folderMap[dataType];
    if (!folder) return {};

    const cacheKey = `${folder}:${language}`;

    if (!dataCache[cacheKey]) {
        const filePath = path.join(DATA_DIR, folder, `${language}.json`);
        if (!fs.existsSync(filePath)) {
            return {};
        }

        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            dataCache[cacheKey] = JSON.parse(fileContent);
        } catch (error) {
            console.error(`Failed to load ${folder}/${language}.json:`, error);
            return {};
        }
    }

    return dataCache[cacheKey];
}
