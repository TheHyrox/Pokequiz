/**
 * @brief Module for loading localized Pokemon data from local files
 * @description Loads ability, egg-group, color, shape, and type data from local JSON files
 */

// Storage for loaded data
const loadedData: {
    [key: string]: { [key: string]: any };
} = {};

/**
 * @brief Dynamically import JSON data
 */
async function loadLocalData(dataType: string, language: string): Promise<any> {
    const cacheKey = `${dataType}-${language}`;

    // Return cached data if already loaded
    if (loadedData[cacheKey]) {
        return loadedData[cacheKey];
    }

    try {
        // Dynamically import the JSON file
        const module = await import(
            `../../server/src/data/${dataType}/${language}.json`,
            { assert: { type: 'json' } }
        );
        loadedData[cacheKey] = module.default || module;
        return loadedData[cacheKey];
    } catch (error) {
        console.warn(`Failed to load ${dataType} data for language ${language}:`, error);
        return {};
    }
}

/**
 * @brief Get localized name from local data
 */
export async function getLocalizedNameFromData(
    dataType: string,
    id: number | string,
    language: string
): Promise<string | null> {
    const data = await loadLocalData(dataType, language);

    if (data[id]?.localizedName) {
        return data[id].localizedName;
    }

    if (data[id]?.name) {
        return data[id].name;
    }

    return null;
}

/**
 * @brief Map data types to folder names
 */
export function getDataFolderName(dataType: string): string {
    const folderMap: { [key: string]: string } = {
        'ability': 'pokemon-ability',
        'egg-group': 'pokemon-egg-group',
        'pokemon-color': 'pokemon-colors',
        'pokemon-shape': 'pokemon-shapes',
        'type': 'pokemon-types'
    };
    return folderMap[dataType] || dataType;
}
