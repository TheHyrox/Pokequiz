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
    getLocalizedEnrichedPokemon
} from './lib/pokemonData.js';
import { spriteQuizService } from './lib/spriteQuizService.js';
import type { SpriteSource, ZoomArtworkSource } from '../../shared/types/index.js';

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

// Helpers
function getLanguageCode(langParam: string): string {
    const languageId = parseInt(langParam, 10);
    if (!isNaN(languageId) && LANGUAGE_ID_TO_CODE[languageId]) {
        return LANGUAGE_ID_TO_CODE[languageId];
    }
    return langParam.toLowerCase();
}

function getLanguageId(langParam: string): string {
    const languageId = parseInt(langParam, 10);
    if (!isNaN(languageId)) return langParam;
    
    const langCodeUpper = langParam.toUpperCase();
    const found = Object.entries(LANGUAGE_ID_TO_CODE).find(
        ([_, code]) => code.toUpperCase() === langCodeUpper
    );
    return found ? found[0] : langParam;
}

// API Routes

app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running!' });
});

app.get('/api/quiz', (req, res) => {
    res.json(spriteQuizService.getQuizCatalog());
});

app.get('/api/pokemon/:id/sprites', async (req, res) => {
    try {
        const { id } = req.params;
        const zoomSource = (req.query.zoomSource as ZoomArtworkSource) || 'official';
        const shinySource = (req.query.shinySource as SpriteSource) || 'default';
        const initialCropSize = req.query.initialCropSize ? parseInt(String(req.query.initialCropSize), 10) : 30;
        const zoomStep = req.query.zoomStep ? parseInt(String(req.query.zoomStep), 10) : 15;
        const fakeOptionsCount = req.query.fakes ? parseInt(String(req.query.fakes), 10) : 4;

        const metadata = await spriteQuizService.getPokemonSpriteMetadata(id, 'en', {
            zoomSource,
            shinySource,
            initialCropSize,
            zoomStep,
            fakeOptionsCount
        });
        if (!metadata) return res.status(404).json({ error: 'Pokemon not found' });
        res.json(metadata);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(400).json({ error: errorMessage });
    }
});

app.get('/api/pokemon/:id/sprites/:lang', async (req, res) => {
    try {
        const { id, lang } = req.params;
        const langCode = getLanguageCode(lang);
        const zoomSource = (req.query.zoomSource as ZoomArtworkSource) || 'official';
        const shinySource = (req.query.shinySource as SpriteSource) || 'default';
        const initialCropSize = req.query.initialCropSize ? parseInt(String(req.query.initialCropSize), 10) : 30;
        const zoomStep = req.query.zoomStep ? parseInt(String(req.query.zoomStep), 10) : 15;
        const fakeOptionsCount = req.query.fakes ? parseInt(String(req.query.fakes), 10) : 4;

        const metadata = await spriteQuizService.getPokemonSpriteMetadata(id, langCode, {
            zoomSource,
            shinySource,
            initialCropSize,
            zoomStep,
            fakeOptionsCount
        });
        if (!metadata) return res.status(404).json({ error: 'Pokemon not found' });
        res.json(metadata);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(400).json({ error: errorMessage });
    }
});

app.get('/api/pokemon/batch/:lang', async (req, res) => {
    try {
        const langCode = getLanguageCode(req.params.lang);
        const idsParam = typeof req.query.ids === 'string' ? req.query.ids : '';
        const ids = idsParam.split(',').map(s => s.trim()).filter(Boolean).slice(0, 50);
        const results: Record<string, any> = {};
        for (const id of ids) {
            const enriched = await getLocalizedEnrichedPokemon(id, langCode);
            if (enriched) {
                results[id] = enriched;
            }
        }
        res.json(results);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(400).json({ error: errorMessage });
    }
});

app.get('/api/pokemon/names/:lang', async (req, res) => {
    try {
        const langId = getLanguageId(req.params.lang);
        const pokemonNames = await getAllPokemonNames(parseInt(langId, 10));
        res.json(pokemonNames);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(400).json({ error: errorMessage });
    }
});

app.get('/api/pokemon/all', (req, res) => {
    try {
        const allPokemon = getAllPokemon();
        res.json(allPokemon);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(400).json({ error: errorMessage });
    }
});

app.get('/api/pokemon/search/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const pokemon = searchPokemonByName(name);
        if (!pokemon) return res.status(404).json({ error: 'Pokemon not found' });
        const enriched = await getLocalizedEnrichedPokemon(pokemon.id, 'en');
        res.json(enriched);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(400).json({ error: errorMessage });
    }
});

app.get('/api/pokemon/search/:name/:lang', async (req, res) => {
    try {
        const { name, lang } = req.params;
        const langCode = getLanguageCode(lang);
        const pokemon = searchPokemonByName(name);
        if (!pokemon) return res.status(404).json({ error: 'Pokemon not found' });
        const enriched = await getLocalizedEnrichedPokemon(pokemon.id, langCode);
        res.json(enriched);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(400).json({ error: errorMessage });
    }
});

app.get('/api/pokemon/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const enriched = await getLocalizedEnrichedPokemon(id, 'en');
        if (!enriched) return res.status(404).json({ error: 'Pokemon not found' });
        res.json(enriched);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(400).json({ error: errorMessage });
    }
});

app.get('/api/pokemon/:id/description/:lang', async (req, res) => {
    try {
        const { id, lang } = req.params;
        const langId = getLanguageId(lang);
        const descriptions = await getApiPokemonDescription(id, langId, null);
        if (!descriptions || descriptions.length === 0) return res.status(404).json({ error: 'Description not found' });
        res.json({ descriptions });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(400).json({ error: errorMessage });
    }
});

app.get('/api/pokemon/:id/name', (req, res) => {
    try {
        const { id } = req.params;
        const pokemon = getPokemonById(id);
        if (!pokemon) return res.status(404).json({ error: 'Pokemon not found' });
        res.json({ name: pokemon.name });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(400).json({ error: errorMessage });
    }
});

app.get('/api/pokemon/:id/name/:lang', async (req, res) => {
    try {
        const { id, lang } = req.params;
        const langId = getLanguageId(lang);
        const pokemonNames = await getAllPokemonNames(parseInt(langId, 10));
        const pokemon = pokemonNames.find((p: any) => String(p.id) === id);
        if (!pokemon) return res.status(404).json({ error: 'Pokemon not found' });
        res.json({ name: pokemon.name });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(400).json({ error: errorMessage });
    }
});

app.get('/api/pokemon/:id/:lang', async (req, res) => {
    try {
        const { id, lang } = req.params;
        const langCode = getLanguageCode(lang);
        const enriched = await getLocalizedEnrichedPokemon(id, langCode);
        if (!enriched) return res.status(404).json({ error: 'Pokemon not found' });
        res.json(enriched);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(400).json({ error: errorMessage });
    }
});

const dataTypeMap: Record<string, string> = {
    'ability': 'ability',
    'color': 'pokemon-color',
    'egggroup': 'egg-group',
    'category': 'category',
    'habitat': 'habitat',
    'shape': 'pokemon-shape',
    'type': 'type'
};

app.get('/api/:dataType/:lang', (req, res, next) => {
    const { dataType, lang } = req.params;
    const internalDataType = dataTypeMap[dataType];
    if (!internalDataType) return next();
    
    try {
        const langCode = getLanguageCode(lang);
        const data = getLocalizedData(internalDataType, langCode);
        res.json(data);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(400).json({ error: errorMessage });
    }
});

app.get('/api/:dataType/:id/:lang', (req, res, next) => {
    const { dataType, id, lang } = req.params;
    const internalDataType = dataTypeMap[dataType];
    if (!internalDataType) return next();

    try {
        const langCode = getLanguageCode(lang);
        const name = getLocalizedName(internalDataType, id, langCode);
        if (!name) return res.status(404).json({ error: 'Resource not found' });
        res.json({ name });
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
