import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAllPokemonNames } from './lib/pokemonCache.js';
import { getLocalizedName, getLocalizedData } from './lib/localizedData.js';
import { 
    getAllPokemon, 
    getPokemonById, 
    searchPokemonByName,
    getPokemonDescription,
    getAllPokemonDescriptions,
    getPokemonHabitat,
    getEnrichedPokemon
} from './lib/pokemonData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../public')));

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
 * @param language Language code
 */
app.get('/api/pokemon/:id/description/:language', (req, res) => {
    try {
        const { id, language } = req.params;
        const description = getPokemonDescription(id, language);
        
        if (!description) {
            return res.status(404).json({ error: 'Description not found' });
        }

        res.json(description);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(400).json({ error: errorMessage });
    }
});

/**
 * @brief Get enriched Pokemon data (with description and habitat)
 * @param id Pokemon ID
 * @param language Language code
 */
app.get('/api/pokemon/:id/enriched/:language', (req, res) => {
    try {
        const { id, language } = req.params;
        const enriched = getEnrichedPokemon(id, language);
        
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
    res.sendFile(path.join(__dirname, '../../public/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
