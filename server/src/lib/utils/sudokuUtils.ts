/**
 * @brief Reusable server-side utilities for Sudoku (PokéGrid) Quiz
 * @description Provides canonical Pokémon traits (Regions, Types, Evolution stages & methods,
 *              Dual type, Monotype, Baby, Partner/Starter, Fossil, Legendary/Mythical/Ultra Beast/Paradox,
 *              Mega/Primal/Gigantamax) and a backtracking maximum bipartite matching solver for
 *              grid solvability and soft-lock prevention.
 */

import type { PokemonEntry } from '../pokemonData.js';
import type {
    SudokuRestriction,
    SudokuRestrictionCategory,
    SudokuGridSize
} from '../../../../shared/types/index.js';
import { ALL_SUDOKU_RESTRICTION_CATEGORIES } from '../../../../shared/constants/index.js';
import { getGenerationForPokemon } from '../../../../shared/utils/pokemonUtils.js';

/**
 * @brief Canonical Baby Pokémon National Pokédex IDs
 */
export const BABY_POKEMON_IDS = new Set<number>([
    172, // Pichu
    173, // Cleffa
    174, // Igglybuff
    175, // Togepi
    236, // Tyrogue
    238, // Smoochum
    239, // Elekid
    240, // Magby
    298, // Azurill
    360, // Wynaut
    406, // Budew
    433, // Chingling
    438, // Bonsly
    439, // Mime Jr.
    440, // Happiny
    446, // Munchlax
    447, // Riolu
    458, // Mantyke
    848  // Toxel
]);

/**
 * @brief Canonical Partner / Starter Pokémon National Pokédex IDs (including their evolutionary lines and partner Pikachu/Eevee)
 */
export const STARTER_POKEMON_IDS = new Set<number>([
    // Gen 1 (Kanto + Yellow/Let's Go Partners)
    1, 2, 3, 4, 5, 6, 7, 8, 9, 25, 26, 133, 134, 135, 136, 196, 197, 470, 471, 700,
    // Gen 2 (Johto)
    152, 153, 154, 155, 156, 157, 158, 159, 160,
    // Gen 3 (Hoenn)
    252, 253, 254, 255, 256, 257, 258, 259, 260,
    // Gen 4 (Sinnoh)
    387, 388, 389, 390, 391, 392, 393, 394, 395,
    // Gen 5 (Unova)
    495, 496, 497, 498, 499, 500, 501, 502, 503,
    // Gen 6 (Kalos)
    650, 651, 652, 653, 654, 655, 656, 657, 658,
    // Gen 7 (Alola)
    722, 723, 724, 725, 726, 727, 728, 729, 730,
    // Gen 8 (Galar)
    810, 811, 812, 813, 814, 815, 816, 817, 818,
    // Gen 9 (Paldea)
    906, 907, 908, 909, 910, 911, 912, 913, 914
]);

/**
 * @brief Canonical Fossil Pokémon National Pokédex IDs
 */
export const FOSSIL_POKEMON_IDS = new Set<number>([
    // Gen 1
    138, 139, 140, 141, 142,
    // Gen 3
    345, 346, 347, 348,
    // Gen 4
    408, 409, 410, 411,
    // Gen 5
    564, 565, 566, 567,
    // Gen 6
    696, 697, 698, 699,
    // Gen 8
    880, 881, 882, 883
]);

/**
 * @brief Canonical Legendary Pokémon National Pokédex IDs
 */
export const LEGENDARY_POKEMON_IDS = new Set<number>([
    // Gen 1
    144, 145, 146, 150,
    // Gen 2
    243, 244, 245, 249, 250,
    // Gen 3
    377, 378, 379, 380, 381, 382, 383, 384,
    // Gen 4
    480, 481, 482, 483, 484, 485, 486, 487, 488,
    // Gen 5
    638, 639, 640, 641, 642, 643, 644, 645, 646,
    // Gen 6
    716, 717, 718,
    // Gen 7
    772, 773, 785, 786, 787, 788, 789, 790, 791, 792, 800,
    // Gen 8
    888, 889, 890, 891, 892, 894, 895, 896, 897, 898, 905,
    // Gen 9
    1001, 1002, 1003, 1004, 1007, 1008, 1014, 1015, 1016, 1017, 1024
]);

/**
 * @brief Canonical Mythical Pokémon National Pokédex IDs
 */
export const MYTHICAL_POKEMON_IDS = new Set<number>([
    151, // Mew
    251, // Celebi
    385, 386, // Jirachi, Deoxys
    489, 490, 491, 492, 493, // Phione, Manaphy, Darkrai, Shaymin, Arceus
    494, 647, 648, 649, // Victini, Keldeo, Meloetta, Genesect
    719, 720, 721, // Diancie, Hoopa, Volcanion
    801, 802, 807, 808, 809, // Magearna, Marshadow, Zeraora, Meltan, Melmetal
    893, // Zarude
    1025 // Pecharunt
]);

/**
 * @brief Canonical Ultra Beast National Pokédex IDs
 */
export const ULTRA_BEAST_IDS = new Set<number>([
    793, 794, 795, 796, 797, 798, 799, 803, 804, 805, 806
]);

/**
 * @brief Canonical Paradox Pokémon National Pokédex IDs
 */
export const PARADOX_POKEMON_IDS = new Set<number>([
    984, 985, 986, 987, 988, 989, 990, 991, 992, 993, 994, 995,
    1005, 1006, 1009, 1010, 1020, 1021, 1022, 1023
]);

/**
 * @brief Canonical Pokémon species with Mega Evolution forms
 */
export const MEGA_POKEMON_IDS = new Set<number>([
    3, 6, 9, 15, 18, 65, 80, 94, 115, 127, 130, 142, 150,
    181, 208, 212, 214, 229, 248, 254, 257, 260, 282, 302, 303, 306, 308, 310, 319, 323, 334, 354, 359, 362, 373, 376, 380, 381, 384,
    428, 445, 448, 460, 475, 531, 719
]);

/**
 * @brief Canonical Pokémon species with Primal Reversion forms
 */
export const PRIMAL_POKEMON_IDS = new Set<number>([
    382, 383 // Kyogre, Groudon
]);

/**
 * @brief Canonical Pokémon species with Gigantamax forms
 */
export const GIGANTAMAX_POKEMON_IDS = new Set<number>([
    3, 6, 9, 12, 25, 52, 68, 94, 99, 131, 133, 143, 569, 809,
    812, 815, 818, 823, 826, 834, 839, 841, 842, 844, 849, 851, 858, 861, 869, 879, 884, 892
]);

/**
 * @brief Canonical Pokémon that evolve via Friendship / Happiness
 */
export const EVOLVED_BY_FRIENDSHIP_IDS = new Set<number>([
    26,  // Pikachu (from Pichu)
    35,  // Clefairy (from Cleffa)
    39,  // Jigglypuff (from Igglybuff)
    113, // Chansey (from Happiny)
    126, // Marill (from Azurill -> 183)
    143, // Snorlax (from Munchlax)
    169, // Crobat (from Golbat)
    176, // Togetic (from Togepi)
    183, // Marill (from Azurill)
    196, // Espeon (from Eevee)
    197, // Umbreon (from Eevee)
    242, // Blissey (from Chansey)
    315, // Roselia (from Budew)
    358, // Chimecho (from Chingling)
    407, // Roserade (line)
    428, // Lopunny (from Buneary)
    448, // Lucario (from Riolu)
    528, // Swoobat (from Woobat)
    542, // Leavanny (from Swadloon)
    700, // Sylveon (affection/friendship from Eevee)
    773, // Silvally (from Type: Null)
    828, // Thievul
    850, // Frosmoth (873)
    873  // Frosmoth (from Snom)
]);

/**
 * @brief Canonical Pokémon that evolve via Trade
 */
export const EVOLVED_BY_TRADE_IDS = new Set<number>([
    65,  // Alakazam
    68,  // Machamp
    76,  // Golem
    94,  // Gengar
    186, // Politoed
    199, // Slowking
    208, // Steelix
    212, // Scizor
    230, // Kingdra
    233, // Porygon2
    367, // Huntail
    368, // Gorebyss
    464, // Rhyperior
    466, // Electivire
    467, // Magmortar
    474, // Porygon-Z
    477, // Dusknoir
    526, // Gigalith
    534, // Conkeldurr
    589, // Escavalier
    617, // Accelgor
    683, // Aromatisse
    685, // Slurpuff
    709, // Trevenant
    711  // Gourgeist
]);

/**
 * @brief Canonical Pokémon that evolve via an Item (Evolution Stone or evolutionary item)
 */
export const EVOLVED_BY_ITEM_IDS = new Set<number>([
    26,  // Raichu (Thunder Stone)
    31,  // Nidoqueen (Moon Stone)
    34,  // Nidoking (Moon Stone)
    36,  // Clefable (Moon Stone)
    38,  // Ninetales (Fire Stone)
    40,  // Wigglytuff (Moon Stone)
    45,  // Vileplume (Leaf Stone)
    59,  // Arcanine (Fire Stone)
    62,  // Poliwrath (Water Stone)
    71,  // Victreebel (Leaf Stone)
    91,  // Cloyster (Water Stone)
    103, // Exeggutor (Leaf Stone)
    121, // Starmie (Water Stone)
    134, // Vaporeon (Water Stone)
    135, // Jolteon (Thunder Stone)
    136, // Flareon (Fire Stone)
    182, // Bellossom (Sun Stone)
    192, // Sunflora (Sun Stone)
    272, // Ludicolo (Water Stone)
    275, // Shiftry (Leaf Stone)
    301, // Delcatty (Moon Stone)
    407, // Roserade (Shiny Stone)
    429, // Mismagius (Dusk Stone)
    430, // Honchkrow (Dusk Stone)
    461, // Weavile (Razor Claw)
    468, // Togekiss (Shiny Stone)
    470, // Leafeon (Leaf Stone)
    471, // Glaceon (Ice Stone)
    472, // Gliscor (Razor Fang)
    475, // Gallade (Dawn Stone)
    478, // Froslass (Dawn Stone)
    512, // Simisage (Leaf Stone)
    514, // Simisear (Fire Stone)
    516, // Simipour (Water Stone)
    518, // Musharna (Moon Stone)
    547, // Whimsicott (Sun Stone)
    549, // Lilligant (Sun Stone)
    573, // Cinccino (Shiny Stone)
    609, // Chandelure (Dusk Stone)
    671, // Florges (Shiny Stone)
    681, // Aegislash (Dusk Stone)
    695, // Heliolisk (Sun Stone)
    738, // Vikavolt (Thunder Stone)
    740, // Crabominable (Ice Stone)
    841, // Flapple (Tart Apple)
    842, // Appletun (Sweet Apple)
    855, // Polteageist (Cracked Pot)
    869, // Alcremie (Sweet)
    892, // Urshifu (Scroll)
    900, // Kleavor (Black Augurite)
    901, // Ursaluna (Peat Block)
    936, // Armarouge (Auspicious Armor)
    937, // Ceruledge (Malicious Armor)
    952, // Scovillain (Fire Stone)
    939, // Bellibolt (Thunder Stone)
    975, // Cetitan (Ice Stone)
    1011, // Dipplin (Syrupy Apple)
    1013, // Sinistcha (Masterpiece Teacup)
    1018  // Archaludon (Metal Alloy)
]);

/**
 * @brief Region ID ranges (including Hisui 899-905 and Galar 810-898)
 */
export const REGION_RANGES: Record<string, { min: number; max: number; extraIds?: number[] }> = {
    kanto:  { min: 1, max: 151 },
    johto:  { min: 152, max: 251 },
    hoenn:  { min: 252, max: 386 },
    sinnoh: { min: 387, max: 493 },
    unova:  { min: 494, max: 649 },
    kalos:  { min: 650, max: 721 },
    alola:  { min: 722, max: 809 },
    galar:  { min: 810, max: 898 },
    hisui:  { min: 899, max: 905, extraIds: [58, 59, 100, 101, 157, 211, 215, 503, 549, 570, 571, 628, 705, 706, 713, 724] },
    paldea: { min: 906, max: 1025 }
};

/**
 * @brief All 18 canonical PokeAPI Type IDs and their keys
 */
export const CANONICAL_TYPES: Array<{ id: string; key: string; }> = [
    { id: '1',  key: 'normal' },
    { id: '10', key: 'fire' },
    { id: '11', key: 'water' },
    { id: '13', key: 'electric' },
    { id: '12', key: 'grass' },
    { id: '15', key: 'ice' },
    { id: '2',  key: 'fighting' },
    { id: '4',  key: 'poison' },
    { id: '5',  key: 'ground' },
    { id: '3',  key: 'flying' },
    { id: '14', key: 'psychic' },
    { id: '7',  key: 'bug' },
    { id: '6',  key: 'rock' },
    { id: '8',  key: 'ghost' },
    { id: '16', key: 'dragon' },
    { id: '17', key: 'dark' },
    { id: '9',  key: 'steel' },
    { id: '18', key: 'fairy' }
];

/**
 * @brief Builds the complete catalog of Sudoku restrictions
 */
export function buildAllSudokuRestrictions(): SudokuRestriction[] {
    const restrictions: SudokuRestriction[] = [];

    // 1. Regions
    const regions: Array<{ id: string; }> = [
        { id: 'kanto' },
        { id: 'johto' },
        { id: 'hoenn' },
        { id: 'sinnoh' },
        { id: 'unova' },
        { id: 'kalos' },
        { id: 'alola' },
        { id: 'galar' },
        { id: 'hisui' },
        { id: 'paldea' }
    ];
    for (const r of regions) {
        restrictions.push({
            id: `region:${r.id}`,
            category: 'region',
            value: r.id,
            labelKey: `sudoku_region_${r.id}`,
            });
    }

    // 2. Types (all 18)
    for (const t of CANONICAL_TYPES) {
        restrictions.push({
            id: `type:${t.id}`,
            category: 'type',
            value: t.id,
            labelKey: `sudoku_type_${t.key}`,
            });
    }

    // 3. Evolution criteria
    const evolutions: Array<{ id: string; }> = [
        { id: 'basic' },
        { id: 'stage1' },
        { id: 'stage2' },
        { id: 'friendship' },
        { id: 'trade' },
        { id: 'item' },
        { id: 'levelup' }
    ];
    for (const ev of evolutions) {
        restrictions.push({
            id: `evolution:${ev.id}`,
            category: 'evolution',
            value: ev.id,
            labelKey: `sudoku_evo_${ev.id}`,
            });
    }

    // 4. Dual type & Monotype
    restrictions.push({
        id: 'dualType',
        category: 'dualType',
        value: 'dualType',
        labelKey: 'sudoku_cat_dualType'
    });
    restrictions.push({
        id: 'monotype',
        category: 'monotype',
        value: 'monotype',
        labelKey: 'sudoku_cat_monotype'
    });

    // 5. Special Traits
    restrictions.push({
        id: 'baby',
        category: 'baby',
        value: 'baby',
        labelKey: 'sudoku_cat_baby'
    });
    restrictions.push({
        id: 'starter',
        category: 'starter',
        value: 'starter',
        labelKey: 'sudoku_cat_starter'
    });
    restrictions.push({
        id: 'fossil',
        category: 'fossil',
        value: 'fossil',
        labelKey: 'sudoku_cat_fossil'
    });
    restrictions.push({
        id: 'legendary',
        category: 'legendary',
        value: 'legendary',
        labelKey: 'sudoku_cat_legendary'
    });
    restrictions.push({
        id: 'mythical',
        category: 'mythical',
        value: 'mythical',
        labelKey: 'sudoku_cat_mythical'
    });
    restrictions.push({
        id: 'ultraBeast',
        category: 'ultraBeast',
        value: 'ultraBeast',
        labelKey: 'sudoku_cat_ultraBeast'
    });
    restrictions.push({
        id: 'paradox',
        category: 'paradox',
        value: 'paradox',
        labelKey: 'sudoku_cat_paradox'
    });
    restrictions.push({
        id: 'mega',
        category: 'mega',
        value: 'mega',
        labelKey: 'sudoku_cat_mega'
    });
    restrictions.push({
        id: 'primal',
        category: 'primal',
        value: 'primal',
        labelKey: 'sudoku_cat_primal'
    });
    restrictions.push({
        id: 'gigantamax',
        category: 'gigantamax',
        value: 'gigantamax',
        labelKey: 'sudoku_cat_gigantamax'
    });

    return restrictions;
}

/**
 * @brief Evaluates whether a given Pokémon satisfies a single SudokuRestriction
 */
export function doesPokemonMatchRestriction(pokemon: PokemonEntry, restriction: SudokuRestriction): boolean {
    const id = Number(pokemon.id);
    const stage = pokemon.parsedEvolutionChain?.stage ?? 1;
    const evolvesFromId = pokemon.parsedEvolutionChain?.evolvesFromId ?? null;

    switch (restriction.category) {
        case 'region': {
            const range = REGION_RANGES[restriction.value];
            if (!range) return false;
            if (id >= range.min && id <= range.max) return true;
            if (range.extraIds && range.extraIds.includes(id)) return true;
            return false;
        }

        case 'type': {
            return pokemon.types.some(t => String(t.id) === String(restriction.value));
        }

        case 'evolution': {
            switch (restriction.value) {
                case 'basic':
                    return stage === 1 && evolvesFromId === null;
                case 'stage1':
                    return stage === 2;
                case 'stage2':
                    return stage >= 3;
                case 'friendship':
                    return EVOLVED_BY_FRIENDSHIP_IDS.has(id);
                case 'trade':
                    return EVOLVED_BY_TRADE_IDS.has(id);
                case 'item':
                    return EVOLVED_BY_ITEM_IDS.has(id);
                case 'levelup':
                    // Any evolved Pokémon (stage >= 2) not exclusively evolved via Trade or Item or Friendship
                    return (
                        stage >= 2 &&
                        !EVOLVED_BY_TRADE_IDS.has(id) &&
                        !EVOLVED_BY_ITEM_IDS.has(id) &&
                        !EVOLVED_BY_FRIENDSHIP_IDS.has(id)
                    );
                default:
                    return false;
            }
        }

        case 'dualType':
            return pokemon.types.length === 2;

        case 'monotype':
            return pokemon.types.length === 1;

        case 'baby':
            return BABY_POKEMON_IDS.has(id);

        case 'starter':
            return STARTER_POKEMON_IDS.has(id);

        case 'fossil':
            return FOSSIL_POKEMON_IDS.has(id);

        case 'legendary':
            return LEGENDARY_POKEMON_IDS.has(id);

        case 'mythical':
            return MYTHICAL_POKEMON_IDS.has(id);

        case 'ultraBeast':
            return ULTRA_BEAST_IDS.has(id);

        case 'paradox':
            return PARADOX_POKEMON_IDS.has(id);

        case 'mega':
            return MEGA_POKEMON_IDS.has(id);

        case 'primal':
            return PRIMAL_POKEMON_IDS.has(id);

        case 'gigantamax':
            return GIGANTAMAX_POKEMON_IDS.has(id);

        default:
            return false;
    }
}

/**
 * @brief Checks if two restrictions are mutually exclusive or redundant on the same axis
 */
export function areRestrictionsCompatibleAxes(r1: SudokuRestriction, r2: SudokuRestriction): boolean {
    if (r1.id === r2.id) return false;
    // Two regions cannot intersect unless one is Hisui (which shares regional forms)
    if (r1.category === 'region' && r2.category === 'region') {
        if (r1.value !== 'hisui' && r2.value !== 'hisui') return false;
    }
    // Dual type and Monotype are mutually exclusive
    if (
        (r1.category === 'dualType' && r2.category === 'monotype') ||
        (r1.category === 'monotype' && r2.category === 'dualType')
    ) {
        return false;
    }
    // Type + Type is compatible (Dual Type Pokémon), EXCEPT if Monotype is also involved
    // Basic and Stage 1 / Stage 2 / Evolved by X are mutually exclusive
    if (r1.category === 'evolution' && r2.category === 'evolution') {
        if (r1.value === 'basic' || r2.value === 'basic') return false;
        if (
            (r1.value === 'stage1' && r2.value === 'stage2') ||
            (r1.value === 'stage2' && r2.value === 'stage1')
        ) {
            return false;
        }
    }
    return true;
}

/**
 * @brief Solves for a disjoint assignment of Pokémon IDs to every cell in an N x N grid
 *        (System of Distinct Representatives / Bipartite Matching).
 * @param cellCandidates Matrix [row][col] of candidate Pokémon IDs
 * @param requireUnique Whether all N*N cells must use distinct Pokémon IDs
 * @param lockedPlacements Optional map of cell key `"r,c"` -> already placed Pokémon ID
 * @returns Matrix [row][col] of assigned Pokémon IDs if solvable, or null if unsolvable
 */
export function findGridSolution(
    cellCandidates: number[][][],
    requireUnique: boolean = true,
    lockedPlacements?: Map<string, number>
): number[][] | null {
    const n = cellCandidates.length;
    const solution: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
    const usedPokemon = new Set<number>();

    const unassignedCells: Array<{ r: number; c: number; candidates: number[] }> = [];

    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            const key = `${r},${c}`;
            const lockedId = lockedPlacements?.get(key);
            if (lockedId !== undefined && lockedId !== null) {
                if (!cellCandidates[r][c].includes(lockedId)) {
                    return null;
                }
                if (requireUnique && usedPokemon.has(lockedId)) {
                    return null;
                }
                solution[r][c] = lockedId;
                if (requireUnique) usedPokemon.add(lockedId);
            } else {
                if (cellCandidates[r][c].length === 0) {
                    return null;
                }
                unassignedCells.push({ r, c, candidates: cellCandidates[r][c] });
            }
        }
    }

    if (!requireUnique) {
        for (const cell of unassignedCells) {
            solution[cell.r][cell.c] = cell.candidates[0];
        }
        return solution;
    }

    // Sort unassigned cells by Minimum Remaining Values (MRV heuristic) for instant backtracking
    unassignedCells.sort((a, b) => a.candidates.length - b.candidates.length);

    function backtrack(idx: number): boolean {
        if (idx >= unassignedCells.length) return true;
        const cell = unassignedCells[idx];
        for (const candId of cell.candidates) {
            if (!usedPokemon.has(candId)) {
                usedPokemon.add(candId);
                solution[cell.r][cell.c] = candId;
                if (backtrack(idx + 1)) return true;
                usedPokemon.delete(candId);
                solution[cell.r][cell.c] = 0;
            }
        }
        return false;
    }

    return backtrack(0) ? solution : null;
}

export { getGenerationForPokemon, ALL_SUDOKU_RESTRICTION_CATEGORIES };
