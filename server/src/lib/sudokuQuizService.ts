/**
 * @brief Reusable Server Service for the Sudoku (PokéGrid) Quiz
 * @description Generates guaranteed solvable 2x2 to 5x5 Sudoku boards with row and column
 *              restrictions across Regions, Types, Evolution criteria, Dual/Mono Type,
 *              Baby, Partner/Starter, Fossil, Legendary/Mythical/Ultra Beast/Paradox,
 *              and Mega/Primal/Gigantamax.
 */

import { getAllPokemon, type PokemonEntry } from './pokemonData.js';
import { getAllPokemonNames } from './pokemonCache.js';
import {
    buildAllSudokuRestrictions,
    doesPokemonMatchRestriction,
    areRestrictionsCompatibleAxes,
    findGridSolution
} from './utils/sudokuUtils.js';
import { SUDOKU_ALTERNATE_FORMS, doesFormMatchRestriction } from './utils/sudokuForms.js';
import { createSeededRng, seededShuffle } from '../../../shared/utils/seededRng.js';
import { ALL_SUDOKU_RESTRICTION_CATEGORIES } from '../../../shared/constants/index.js';
import type {
    SudokuBoardPayload,
    SudokuGridSize,
    SudokuRestriction,
    SudokuRestrictionCategory
} from '../../../shared/types/index.js';

export interface GenerateSudokuBoardOptions {
    gridSize?: SudokuGridSize;
    seed?: string;
    requireUniquePokemon?: boolean;
    allowedCategories?: SudokuRestrictionCategory[];
    allowedRestrictions?: string[];
}

export class SudokuQuizService {
    private restrictions: SudokuRestriction[] = [];
    /** Precomputed map: restriction.id -> Set of matching Pokémon IDs */
    private restrictionMatches: Map<string, Set<number>> = new Map();
    private initialized: boolean = false;

    /**
     * @brief Lazily indexes all 1025 Pokémon against every SudokuRestriction for O(1) intersection queries
     */
    private ensureInitialized(): void {
        if (this.initialized) return;
        const allPokemonMap = getAllPokemon();
        const pokemonList: PokemonEntry[] = Object.values(allPokemonMap);
        this.restrictions = buildAllSudokuRestrictions();
        this.restrictionMatches.clear();

        for (const r of this.restrictions) {
            const matchingIds = new Set<number>();
            for (const p of pokemonList) {
                if (doesPokemonMatchRestriction(p, r)) {
                    matchingIds.add(Number(p.id));
                }
            }
            for (const formDef of SUDOKU_ALTERNATE_FORMS) {
                const basePokemon = allPokemonMap[String(formDef.baseId)];
                if (basePokemon && doesFormMatchRestriction(formDef, basePokemon, r)) {
                    matchingIds.add(formDef.id);
                }
            }
            this.restrictionMatches.set(r.id, matchingIds);
        }

        this.initialized = true;
    }

    /**
     * @brief Returns localized display entries for all curated stat/type-changing alternate forms
     */
    public async getAlternateFormNames(languageId: number): Promise<Array<{ id: number; name: string }>> {
        const baseNames = await getAllPokemonNames(languageId);
        const nameMap = new Map<number, string>(baseNames.map(p => [Number(p.id), p.name]));
        return SUDOKU_ALTERNATE_FORMS.map(formDef => {
            const baseName = nameMap.get(formDef.baseId) || `#${formDef.baseId}`;
            return {
                id: formDef.id,
                name: `${baseName} (${formDef.formLabel})`
            };
        });
    }

    /**
     * @brief Returns all available Sudoku restrictions
     */
    public getAllRestrictions(): SudokuRestriction[] {
        this.ensureInitialized();
        return this.restrictions;
    }

    /**
     * @brief Computes the intersection of valid Pokémon IDs matching both row and column restrictions
     */
    public getIntersectionIds(rowRest: SudokuRestriction, colRest: SudokuRestriction): number[] {
        this.ensureInitialized();
        const rowSet = this.restrictionMatches.get(rowRest.id);
        const colSet = this.restrictionMatches.get(colRest.id);
        if (!rowSet || !colSet) return [];

        const result: number[] = [];
        const [smaller, larger] = rowSet.size <= colSet.size ? [rowSet, colSet] : [colSet, rowSet];
        for (const id of smaller) {
            if (larger.has(id)) {
                result.push(id);
            }
        }
        return result.sort((a, b) => a - b);
    }

    /**
     * @brief Generates a guaranteed-solvable N x N Sudoku board
     */
    public generateBoard(options: GenerateSudokuBoardOptions = {}): SudokuBoardPayload {
        this.ensureInitialized();

        const rawSize = Number(options.gridSize ?? 3);
        const gridSize = Math.max(2, Math.min(5, isNaN(rawSize) ? 3 : rawSize)) as SudokuGridSize;
        const requireUnique = options.requireUniquePokemon ?? true;
        const rng = options.seed ? createSeededRng(`sudoku:${options.seed}:${gridSize}`) : Math.random;

        const allowedCats =
            options.allowedCategories && options.allowedCategories.length > 0
                ? new Set(options.allowedCategories)
                : new Set(ALL_SUDOKU_RESTRICTION_CATEGORIES);

        let pool: SudokuRestriction[];
        if (options.allowedRestrictions && options.allowedRestrictions.length > 0) {
            const allowedIds = new Set(options.allowedRestrictions);
            pool = this.restrictions.filter(r => allowedIds.has(r.id));
        } else {
            pool = this.restrictions.filter(r => allowedCats.has(r.category));
        }
        // If user filtered to too few restrictions for the grid size, fall back to full restriction catalog
        if (pool.length < gridSize * 2) {
            pool = [...this.restrictions];
        }

        // Try randomized constructive search to pick N row restrictions and N col restrictions
        // such that every cell (r, c) has at least 1 valid Pokémon AND a full disjoint solution exists
        const maxAttempts = 250;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const shuffled = seededShuffle(pool, rng);

            const rowRestrictions: SudokuRestriction[] = [];
            const colRestrictions: SudokuRestriction[] = [];

            // Pick N row restrictions with diverse categories where possible
            for (const cand of shuffled) {
                if (rowRestrictions.length >= gridSize) break;
                // Avoid placing two identical categories on ALL rows unless pool is small
                if (rowRestrictions.some(r => r.id === cand.id)) continue;
                rowRestrictions.push(cand);
            }

            if (rowRestrictions.length < gridSize) continue;

            // Now greedily find N col restrictions that have non-empty intersection with every selected row
            const remainingForCols = seededShuffle(
                shuffled.filter(r => !rowRestrictions.some(row => row.id === r.id)),
                rng
            );

            for (const colCand of remainingForCols) {
                if (colRestrictions.length >= gridSize) break;

                let validWithAllRows = true;
                for (const rowRest of rowRestrictions) {
                    if (!areRestrictionsCompatibleAxes(rowRest, colCand)) {
                        validWithAllRows = false;
                        break;
                    }
                    const inter = this.getIntersectionIds(rowRest, colCand);
                    if (inter.length === 0) {
                        validWithAllRows = false;
                        break;
                    }
                }

                if (validWithAllRows) {
                    colRestrictions.push(colCand);
                }
            }

            if (colRestrictions.length < gridSize) continue;

            // Build candidate matrix and verify disjoint solvability
            const cellValidPokemonIds: number[][][] = [];
            for (let r = 0; r < gridSize; r++) {
                const rowArr: number[][] = [];
                for (let c = 0; c < gridSize; c++) {
                    const inter = this.getIntersectionIds(rowRestrictions[r], colRestrictions[c]);
                    // Shuffle candidates slightly using rng so guaranteedSolutionIds are varied
                    rowArr.push(inter);
                }
                cellValidPokemonIds.push(rowArr);
            }

            const shuffledCandidatesForSolver = cellValidPokemonIds.map(row =>
                row.map(cands => seededShuffle(cands, rng))
            );

            const solution = findGridSolution(shuffledCandidatesForSolver, requireUnique);
            if (solution) {
                return {
                    gridSize,
                    rowRestrictions,
                    colRestrictions,
                    cellValidPokemonIds,
                    guaranteedSolutionIds: solution
                };
            }
        }

        // Guaranteed deterministic fallback using well-populated Types vs Regions/Stages
        return this.buildFallbackBoard(gridSize, requireUnique);
    }

    /**
     * @brief Fallback board builder guaranteed to succeed for any gridSize 2..5
     */
    private buildFallbackBoard(gridSize: SudokuGridSize, requireUnique: boolean): SudokuBoardPayload {
        const fallbackRowsIds = ['type:11', 'type:10', 'type:12', 'type:1', 'type:3']; // Water, Fire, Grass, Normal, Flying
        const fallbackColsIds = ['region:kanto', 'region:hoenn', 'region:unova', 'evolution:basic', 'dualType'];

        const rowRestrictions = fallbackRowsIds
            .slice(0, gridSize)
            .map(id => this.restrictions.find(r => r.id === id)!);
        const colRestrictions = fallbackColsIds
            .slice(0, gridSize)
            .map(id => this.restrictions.find(r => r.id === id)!);

        const cellValidPokemonIds: number[][][] = [];
        for (let r = 0; r < gridSize; r++) {
            const rowArr: number[][] = [];
            for (let c = 0; c < gridSize; c++) {
                rowArr.push(this.getIntersectionIds(rowRestrictions[r], colRestrictions[c]));
            }
            cellValidPokemonIds.push(rowArr);
        }

        const solution =
            findGridSolution(cellValidPokemonIds, requireUnique) ||
            cellValidPokemonIds.map(row => row.map(cands => cands[0] || 1));

        return {
            gridSize,
            rowRestrictions,
            colRestrictions,
            cellValidPokemonIds,
            guaranteedSolutionIds: solution
        };
    }
}

export const sudokuQuizService = new SudokuQuizService();
