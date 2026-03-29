import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAllPokemonNames } from './lib/pokemonCache.js';

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

// Serve client app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
