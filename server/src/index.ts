import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAllPokemonNames } from './lib/pokemonCache.js';
import { getLocalizedName, getLocalizedData } from './lib/localizedData.js';

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

// Serve client app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
