import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { LANGUAGE_ID_TO_CODE } from '../../shared/constants/index.js';
import { getAllPokemonNames } from './lib/pokemonCache.js';
import { getLocalizedName, getLocalizedData } from './lib/localizedData.js';
import { getPokemonDescription as getApiPokemonDescription } from './lib/description.js';
import { 
    getAllPokemon, 
    getPokemonById, 
    searchPokemonByName,
    getAllPokemonDescriptions,
    getPokemonHabitat,
    getEnrichedPokemon
} from './lib/pokemonData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

const clientPath = __dirname.includes('dist') 
    ? path.join(__dirname, '../../../../dist') 
    : path.join(__dirname, '../../dist');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(clientPath));

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running!' });
});

app.get('/api/pokemon/names/:languageId', async (req, res) => {
    try {
        const languageId = parseInt(req.params.languageId, 10);
        const pokemonNames = await getAllPokemonNames(languageId);
        res.json(pokemonNames);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(400).json({ error: errorMessage });
    }
});

/**
 * @brief Get localized name for a specific resource
 * @param dataType ability, egg-group, pokemon-color, pokemon-shape, type
 * @param resourceId ID of the resource
 * @param language Language code (en, fr, de, es, it, ja, ja-hrkt, ko, zh-hans, zh-hant)
 */
app.get('/api/localized/:dataType/:resourceId/:language', (req, res) => {
    try {
        const { dataType, resourceId, language } = req.params;
        const name = getLocalizedName(dataType, resourceId, language);
        
        if (!name) {
            return res.status(404).json({ error: 'Resource not found' });
        }

        res.json({ name });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(400).json({ error: errorMessage });
    }
});

/**
 * @brief Get all localized data for a type and language
 * @param dataType ability, egg-group, pokemon-color, pokemon-shape, type
 * @param language Language code (en, fr, de, es, it, ja, ja-hrkt, ko, zh-hans, zh-hant)
 */
app.get('/api/localized-data/:dataType/:language', (req, res) => {
    try {
        const { dataType, language } = req.params;
        const data = getLocalizedData(dataType, language);
        res.json(data);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(400).json({ error: errorMessage });
    }
});

/**
 * @brief Get all Pokemon with basic attributes
 */
app.get('/api/pokemon/all', (req, res) => {
    try {
        const allPokemon = getAllPokemon();
        res.json(allPokemon);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(400).json({ error: errorMessage });
    }
});

/**
 * @brief Get Pokemon by ID with basic attributes
 * @param id Pokemon ID
 */
app.get('/api/pokemon/:id', (req, res) => {
    try {
        const { id } = req.params;
        const pokemon = getPokemonById(id);
        
        if (!pokemon) {
            return res.status(404).json({ error: 'Pokemon not found' });
        }

        res.json(pokemon);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(400).json({ error: errorMessage });
    }
});

/**
 * @brief Search Pokemon by name
 * @param name Pokemon name
 */
app.get('/api/pokemon/search/:name', (req, res) => {
    try {
        const { name } = req.params;
        const pokemon = searchPokemonByName(name);
        
        if (!pokemon) {
            return res.status(404).json({ error: 'Pokemon not found' });
        }

        res.json(pokemon);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(400).json({ error: errorMessage });
    }
});

/**
 * @brief Get Pokemon descriptions for a language
 * @param language Language code
 */
app.get('/api/pokemon/descriptions/:language', (req, res) => {
    try {
        const { language } = req.params;
        const descriptions = getAllPokemonDescriptions(language);
        res.json(descriptions);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(400).json({ error: errorMessage });
    }
});

/**
 * @brief Get Pokemon description by ID and language
 * @param id Pokemon ID
 * @param language Language code (e.g., 'fr', 'en') or language ID (e.g., 5, 9)
 */
app.get('/api/pokemon/:id/description/:language', async (req, res) => {
    try {
        const { id, language } = req.params;
        
        // Convert language code to ID if needed
        let languageId = language;
        if (isNaN(parseInt(language, 10))) {
            // It's a language code, find the ID
            const langCodeUpper = language.toUpperCase();
            const found = Object.entries(LANGUAGE_ID_TO_CODE).find(
                ([_, code]) => code.toUpperCase() === langCodeUpper
            );
            languageId = found ? found[0] : language; // Use language ID if found, otherwise try the code
        }
        
        const descriptions = await getApiPokemonDescription(id, languageId, null);
        
        if (!descriptions || descriptions.length === 0) {
            return res.status(404).json({ error: 'Description not found' });
        }

        res.json({ descriptions });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(400).json({ error: errorMessage });
    }
});

/**
 * @brief Get enriched Pokemon data (with description and habitat)
 * @param id Pokemon ID
 * @param language Language code (e.g., 'fr', 'en') or language ID (e.g., 5, 9)
 */
app.get('/api/pokemon/:id/enriched/:language', (req, res) => {
    try {
        const { id, language } = req.params;
        
        // Convert language ID to code if a numeric ID is provided
        let languageCode = language;
        const languageId = parseInt(language, 10);
        if (!isNaN(languageId) && LANGUAGE_ID_TO_CODE[languageId]) {
            languageCode = LANGUAGE_ID_TO_CODE[languageId];
        }
        
        const enriched = getEnrichedPokemon(id, languageCode);
        
        if (!enriched) {
            return res.status(404).json({ error: 'Pokemon not found' });
        }

        res.json(enriched);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(400).json({ error: errorMessage });
    }
});

// Serve client app
app.get('*', (req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
