/**
 * @brief Curated list of stat-changing and type-changing alternate Pokémon forms for PokéSudoku
 * @description Includes Mega Evolutions, Primal Reversions, Gigantamax forms, Kyurem Black/White,
 *              Necrozma forms, Calyrex Riders, Rotom appliances, Regional forms (Alola/Galar/Hisui/Paldea),
 *              and other battle/stat-changing forms (excluding purely cosmetic forms like Arceus/Vivillon/Furfrou).
 */

import type { PokemonEntry } from '../pokemonData.js';
import type { SudokuRestriction } from '../../../../shared/types/index.js';
import { doesPokemonMatchRestriction, REGION_RANGES } from './sudokuUtils.js';

export interface SudokuAlternateFormDef {
    /** PokeAPI form ID (10001+) */
    id: number;
    /** Base National Pokédex ID (1..1025) */
    baseId: number;
    /** Display suffix appended to localized base Pokémon name */
    formLabel: string;
    /** Exact type IDs for this form */
    typeIds: string[];
    /** Region override (for regional forms) */
    regionOverride?: string;
    /** Special form trait override */
    formTrait?: 'mega' | 'primal' | 'gigantamax';
}

export const SUDOKU_ALTERNATE_FORMS: SudokuAlternateFormDef[] = [
    // Deoxys, Wormadam, Shaymin, Giratina, Rotom
    { id: 10001, baseId: 386, formLabel: 'Attack', typeIds: ['14'] },
    { id: 10002, baseId: 386, formLabel: 'Defense', typeIds: ['14'] },
    { id: 10003, baseId: 386, formLabel: 'Speed', typeIds: ['14'] },
    { id: 10004, baseId: 413, formLabel: 'Sandy', typeIds: ['7', '5'] },
    { id: 10005, baseId: 413, formLabel: 'Trash', typeIds: ['7', '9'] },
    { id: 10006, baseId: 492, formLabel: 'Sky', typeIds: ['12', '3'] },
    { id: 10007, baseId: 487, formLabel: 'Origin', typeIds: ['8', '16'] },
    { id: 10008, baseId: 479, formLabel: 'Heat', typeIds: ['13', '10'] },
    { id: 10009, baseId: 479, formLabel: 'Wash', typeIds: ['13', '11'] },
    { id: 10010, baseId: 479, formLabel: 'Frost', typeIds: ['13', '15'] },
    { id: 10011, baseId: 479, formLabel: 'Fan', typeIds: ['13', '3'] },
    { id: 10012, baseId: 479, formLabel: 'Mow', typeIds: ['13', '12'] },
    // Darmanitan Zen, Meloetta Pirouette, Therian Forces of Nature, Kyurem Black/White
    { id: 10017, baseId: 555, formLabel: 'Zen', typeIds: ['10', '14'] },
    { id: 10018, baseId: 648, formLabel: 'Pirouette', typeIds: ['1', '2'] },
    { id: 10019, baseId: 641, formLabel: 'Therian', typeIds: ['3'] },
    { id: 10020, baseId: 642, formLabel: 'Therian', typeIds: ['13', '3'] },
    { id: 10021, baseId: 645, formLabel: 'Therian', typeIds: ['5', '3'] },
    { id: 10022, baseId: 646, formLabel: 'Black', typeIds: ['16', '15'] },
    { id: 10023, baseId: 646, formLabel: 'White', typeIds: ['16', '15'] },
    { id: 10026, baseId: 681, formLabel: 'Blade', typeIds: ['9', '8'] },
    // Mega Evolutions
    { id: 10033, baseId: 3, formLabel: 'Mega', typeIds: ['12', '4'], formTrait: 'mega' },
    { id: 10034, baseId: 6, formLabel: 'Mega X', typeIds: ['10', '16'], formTrait: 'mega' },
    { id: 10035, baseId: 6, formLabel: 'Mega Y', typeIds: ['10', '3'], formTrait: 'mega' },
    { id: 10036, baseId: 9, formLabel: 'Mega', typeIds: ['11'], formTrait: 'mega' },
    { id: 10037, baseId: 65, formLabel: 'Mega', typeIds: ['14'], formTrait: 'mega' },
    { id: 10038, baseId: 94, formLabel: 'Mega', typeIds: ['8', '4'], formTrait: 'mega' },
    { id: 10039, baseId: 115, formLabel: 'Mega', typeIds: ['1'], formTrait: 'mega' },
    { id: 10040, baseId: 127, formLabel: 'Mega', typeIds: ['7', '3'], formTrait: 'mega' },
    { id: 10041, baseId: 130, formLabel: 'Mega', typeIds: ['11', '17'], formTrait: 'mega' },
    { id: 10042, baseId: 142, formLabel: 'Mega', typeIds: ['6', '3'], formTrait: 'mega' },
    { id: 10043, baseId: 150, formLabel: 'Mega X', typeIds: ['14', '2'], formTrait: 'mega' },
    { id: 10044, baseId: 150, formLabel: 'Mega Y', typeIds: ['14'], formTrait: 'mega' },
    { id: 10045, baseId: 181, formLabel: 'Mega', typeIds: ['13', '16'], formTrait: 'mega' },
    { id: 10046, baseId: 212, formLabel: 'Mega', typeIds: ['7', '9'], formTrait: 'mega' },
    { id: 10047, baseId: 214, formLabel: 'Mega', typeIds: ['7', '2'], formTrait: 'mega' },
    { id: 10048, baseId: 229, formLabel: 'Mega', typeIds: ['17', '10'], formTrait: 'mega' },
    { id: 10049, baseId: 248, formLabel: 'Mega', typeIds: ['6', '17'], formTrait: 'mega' },
    { id: 10050, baseId: 257, formLabel: 'Mega', typeIds: ['10', '2'], formTrait: 'mega' },
    { id: 10051, baseId: 282, formLabel: 'Mega', typeIds: ['14', '18'], formTrait: 'mega' },
    { id: 10052, baseId: 303, formLabel: 'Mega', typeIds: ['9', '18'], formTrait: 'mega' },
    { id: 10053, baseId: 306, formLabel: 'Mega', typeIds: ['9'], formTrait: 'mega' },
    { id: 10054, baseId: 308, formLabel: 'Mega', typeIds: ['2', '14'], formTrait: 'mega' },
    { id: 10055, baseId: 310, formLabel: 'Mega', typeIds: ['13'], formTrait: 'mega' },
    { id: 10056, baseId: 354, formLabel: 'Mega', typeIds: ['8'], formTrait: 'mega' },
    { id: 10057, baseId: 359, formLabel: 'Mega', typeIds: ['17'], formTrait: 'mega' },
    { id: 10058, baseId: 445, formLabel: 'Mega', typeIds: ['16', '5'], formTrait: 'mega' },
    { id: 10059, baseId: 448, formLabel: 'Mega', typeIds: ['2', '9'], formTrait: 'mega' },
    { id: 10060, baseId: 460, formLabel: 'Mega', typeIds: ['12', '15'], formTrait: 'mega' },
    { id: 10062, baseId: 380, formLabel: 'Mega', typeIds: ['16', '14'], formTrait: 'mega' },
    { id: 10063, baseId: 381, formLabel: 'Mega', typeIds: ['16', '14'], formTrait: 'mega' },
    { id: 10064, baseId: 260, formLabel: 'Mega', typeIds: ['11', '5'], formTrait: 'mega' },
    { id: 10065, baseId: 254, formLabel: 'Mega', typeIds: ['12', '16'], formTrait: 'mega' },
    { id: 10066, baseId: 302, formLabel: 'Mega', typeIds: ['17', '8'], formTrait: 'mega' },
    { id: 10067, baseId: 334, formLabel: 'Mega', typeIds: ['16', '18'], formTrait: 'mega' },
    { id: 10068, baseId: 475, formLabel: 'Mega', typeIds: ['14', '2'], formTrait: 'mega' },
    { id: 10069, baseId: 531, formLabel: 'Mega', typeIds: ['1', '18'], formTrait: 'mega' },
    { id: 10070, baseId: 319, formLabel: 'Mega', typeIds: ['11', '17'], formTrait: 'mega' },
    { id: 10071, baseId: 80, formLabel: 'Mega', typeIds: ['11', '14'], formTrait: 'mega' },
    { id: 10072, baseId: 208, formLabel: 'Mega', typeIds: ['9', '5'], formTrait: 'mega' },
    { id: 10073, baseId: 18, formLabel: 'Mega', typeIds: ['1', '3'], formTrait: 'mega' },
    { id: 10074, baseId: 362, formLabel: 'Mega', typeIds: ['15'], formTrait: 'mega' },
    { id: 10075, baseId: 719, formLabel: 'Mega', typeIds: ['6', '18'], formTrait: 'mega' },
    { id: 10076, baseId: 376, formLabel: 'Mega', typeIds: ['9', '14'], formTrait: 'mega' },
    { id: 10077, baseId: 382, formLabel: 'Primal', typeIds: ['11'], formTrait: 'primal' },
    { id: 10078, baseId: 383, formLabel: 'Primal', typeIds: ['5', '10'], formTrait: 'primal' },
    { id: 10079, baseId: 384, formLabel: 'Mega', typeIds: ['16', '3'], formTrait: 'mega' },
    { id: 10086, baseId: 720, formLabel: 'Unbound', typeIds: ['14', '17'] },
    { id: 10087, baseId: 323, formLabel: 'Mega', typeIds: ['10', '5'], formTrait: 'mega' },
    { id: 10088, baseId: 428, formLabel: 'Mega', typeIds: ['1', '2'], formTrait: 'mega' },
    { id: 10089, baseId: 373, formLabel: 'Mega', typeIds: ['16', '3'], formTrait: 'mega' },
    { id: 10090, baseId: 15, formLabel: 'Mega', typeIds: ['7', '4'], formTrait: 'mega' },
    // Alolan Regional Forms
    { id: 10091, baseId: 19, formLabel: 'Alola', typeIds: ['17', '1'], regionOverride: 'alola' },
    { id: 10092, baseId: 20, formLabel: 'Alola', typeIds: ['17', '1'], regionOverride: 'alola' },
    { id: 10100, baseId: 26, formLabel: 'Alola', typeIds: ['13', '14'], regionOverride: 'alola' },
    { id: 10101, baseId: 27, formLabel: 'Alola', typeIds: ['15', '9'], regionOverride: 'alola' },
    { id: 10102, baseId: 28, formLabel: 'Alola', typeIds: ['15', '9'], regionOverride: 'alola' },
    { id: 10103, baseId: 37, formLabel: 'Alola', typeIds: ['15'], regionOverride: 'alola' },
    { id: 10104, baseId: 38, formLabel: 'Alola', typeIds: ['15', '18'], regionOverride: 'alola' },
    { id: 10105, baseId: 50, formLabel: 'Alola', typeIds: ['5', '9'], regionOverride: 'alola' },
    { id: 10106, baseId: 51, formLabel: 'Alola', typeIds: ['5', '9'], regionOverride: 'alola' },
    { id: 10107, baseId: 52, formLabel: 'Alola', typeIds: ['17'], regionOverride: 'alola' },
    { id: 10108, baseId: 53, formLabel: 'Alola', typeIds: ['17'], regionOverride: 'alola' },
    { id: 10109, baseId: 74, formLabel: 'Alola', typeIds: ['6', '13'], regionOverride: 'alola' },
    { id: 10110, baseId: 75, formLabel: 'Alola', typeIds: ['6', '13'], regionOverride: 'alola' },
    { id: 10111, baseId: 76, formLabel: 'Alola', typeIds: ['6', '13'], regionOverride: 'alola' },
    { id: 10112, baseId: 88, formLabel: 'Alola', typeIds: ['4', '17'], regionOverride: 'alola' },
    { id: 10113, baseId: 89, formLabel: 'Alola', typeIds: ['4', '17'], regionOverride: 'alola' },
    { id: 10114, baseId: 103, formLabel: 'Alola', typeIds: ['12', '16'], regionOverride: 'alola' },
    { id: 10115, baseId: 105, formLabel: 'Alola', typeIds: ['10', '8'], regionOverride: 'alola' },
    // Gen 7 Battle/Type Forms & Necrozma
    { id: 10117, baseId: 658, formLabel: 'Ash', typeIds: ['11', '17'] },
    { id: 10118, baseId: 718, formLabel: '10%', typeIds: ['16', '5'] },
    { id: 10120, baseId: 718, formLabel: 'Complete', typeIds: ['16', '5'] },
    { id: 10123, baseId: 741, formLabel: 'Pom-Pom', typeIds: ['13', '3'] },
    { id: 10124, baseId: 741, formLabel: "Pa'u", typeIds: ['14', '3'] },
    { id: 10125, baseId: 741, formLabel: 'Sensu', typeIds: ['8', '3'] },
    { id: 10126, baseId: 745, formLabel: 'Midnight', typeIds: ['6'] },
    { id: 10127, baseId: 746, formLabel: 'School', typeIds: ['11'] },
    { id: 10152, baseId: 745, formLabel: 'Dusk', typeIds: ['6'] },
    { id: 10155, baseId: 800, formLabel: 'Dusk Mane', typeIds: ['14', '9'] },
    { id: 10156, baseId: 800, formLabel: 'Dawn Wings', typeIds: ['14', '8'] },
    { id: 10157, baseId: 800, formLabel: 'Ultra', typeIds: ['14', '16'] },
    // Galarian Regional Forms
    { id: 10161, baseId: 52, formLabel: 'Galar', typeIds: ['9'], regionOverride: 'galar' },
    { id: 10162, baseId: 77, formLabel: 'Galar', typeIds: ['14'], regionOverride: 'galar' },
    { id: 10163, baseId: 78, formLabel: 'Galar', typeIds: ['14', '18'], regionOverride: 'galar' },
    { id: 10164, baseId: 79, formLabel: 'Galar', typeIds: ['14'], regionOverride: 'galar' },
    { id: 10165, baseId: 80, formLabel: 'Galar', typeIds: ['4', '14'], regionOverride: 'galar' },
    { id: 10166, baseId: 83, formLabel: 'Galar', typeIds: ['2'], regionOverride: 'galar' },
    { id: 10167, baseId: 110, formLabel: 'Galar', typeIds: ['4', '18'], regionOverride: 'galar' },
    { id: 10168, baseId: 122, formLabel: 'Galar', typeIds: ['15', '14'], regionOverride: 'galar' },
    { id: 10169, baseId: 144, formLabel: 'Galar', typeIds: ['14', '3'], regionOverride: 'galar' },
    { id: 10170, baseId: 145, formLabel: 'Galar', typeIds: ['2', '3'], regionOverride: 'galar' },
    { id: 10171, baseId: 146, formLabel: 'Galar', typeIds: ['17', '3'], regionOverride: 'galar' },
    { id: 10172, baseId: 199, formLabel: 'Galar', typeIds: ['4', '14'], regionOverride: 'galar' },
    { id: 10173, baseId: 222, formLabel: 'Galar', typeIds: ['8'], regionOverride: 'galar' },
    { id: 10174, baseId: 263, formLabel: 'Galar', typeIds: ['17', '1'], regionOverride: 'galar' },
    { id: 10175, baseId: 264, formLabel: 'Galar', typeIds: ['17', '1'], regionOverride: 'galar' },
    { id: 10176, baseId: 554, formLabel: 'Galar', typeIds: ['15'], regionOverride: 'galar' },
    { id: 10177, baseId: 555, formLabel: 'Galar', typeIds: ['15'], regionOverride: 'galar' },
    { id: 10178, baseId: 555, formLabel: 'Galar Zen', typeIds: ['15', '10'], regionOverride: 'galar' },
    { id: 10179, baseId: 562, formLabel: 'Galar', typeIds: ['5', '8'], regionOverride: 'galar' },
    { id: 10180, baseId: 618, formLabel: 'Galar', typeIds: ['5', '9'], regionOverride: 'galar' },
    // Zacian / Zamazenta / Eternatus / Urshifu / Calyrex
    { id: 10188, baseId: 888, formLabel: 'Crowned', typeIds: ['18', '9'] },
    { id: 10189, baseId: 889, formLabel: 'Crowned', typeIds: ['2', '9'] },
    { id: 10190, baseId: 890, formLabel: 'Eternamax', typeIds: ['4', '16'] },
    { id: 10191, baseId: 892, formLabel: 'Rapid Strike', typeIds: ['2', '11'] },
    { id: 10193, baseId: 898, formLabel: 'Ice Rider', typeIds: ['14', '15'] },
    { id: 10194, baseId: 898, formLabel: 'Shadow Rider', typeIds: ['14', '8'] },
    // Gigantamax Forms
    { id: 10195, baseId: 3, formLabel: 'Gigantamax', typeIds: ['12', '4'], formTrait: 'gigantamax' },
    { id: 10196, baseId: 6, formLabel: 'Gigantamax', typeIds: ['10', '3'], formTrait: 'gigantamax' },
    { id: 10197, baseId: 9, formLabel: 'Gigantamax', typeIds: ['11'], formTrait: 'gigantamax' },
    { id: 10198, baseId: 12, formLabel: 'Gigantamax', typeIds: ['7', '3'], formTrait: 'gigantamax' },
    { id: 10199, baseId: 25, formLabel: 'Gigantamax', typeIds: ['13'], formTrait: 'gigantamax' },
    { id: 10200, baseId: 52, formLabel: 'Gigantamax', typeIds: ['1'], formTrait: 'gigantamax' },
    { id: 10201, baseId: 68, formLabel: 'Gigantamax', typeIds: ['2'], formTrait: 'gigantamax' },
    { id: 10202, baseId: 94, formLabel: 'Gigantamax', typeIds: ['8', '4'], formTrait: 'gigantamax' },
    { id: 10203, baseId: 99, formLabel: 'Gigantamax', typeIds: ['11'], formTrait: 'gigantamax' },
    { id: 10204, baseId: 131, formLabel: 'Gigantamax', typeIds: ['11', '15'], formTrait: 'gigantamax' },
    { id: 10205, baseId: 133, formLabel: 'Gigantamax', typeIds: ['1'], formTrait: 'gigantamax' },
    { id: 10206, baseId: 143, formLabel: 'Gigantamax', typeIds: ['1'], formTrait: 'gigantamax' },
    { id: 10207, baseId: 569, formLabel: 'Gigantamax', typeIds: ['4'], formTrait: 'gigantamax' },
    { id: 10208, baseId: 809, formLabel: 'Gigantamax', typeIds: ['9'], formTrait: 'gigantamax' },
    { id: 10209, baseId: 812, formLabel: 'Gigantamax', typeIds: ['12'], formTrait: 'gigantamax' },
    { id: 10210, baseId: 815, formLabel: 'Gigantamax', typeIds: ['10'], formTrait: 'gigantamax' },
    { id: 10211, baseId: 818, formLabel: 'Gigantamax', typeIds: ['11'], formTrait: 'gigantamax' },
    { id: 10212, baseId: 823, formLabel: 'Gigantamax', typeIds: ['3', '9'], formTrait: 'gigantamax' },
    { id: 10213, baseId: 826, formLabel: 'Gigantamax', typeIds: ['7', '14'], formTrait: 'gigantamax' },
    { id: 10214, baseId: 834, formLabel: 'Gigantamax', typeIds: ['11', '6'], formTrait: 'gigantamax' },
    { id: 10215, baseId: 839, formLabel: 'Gigantamax', typeIds: ['6', '10'], formTrait: 'gigantamax' },
    { id: 10216, baseId: 841, formLabel: 'Gigantamax', typeIds: ['12', '16'], formTrait: 'gigantamax' },
    { id: 10217, baseId: 842, formLabel: 'Gigantamax', typeIds: ['12', '16'], formTrait: 'gigantamax' },
    { id: 10218, baseId: 844, formLabel: 'Gigantamax', typeIds: ['5'], formTrait: 'gigantamax' },
    { id: 10219, baseId: 849, formLabel: 'Gigantamax', typeIds: ['13', '4'], formTrait: 'gigantamax' },
    { id: 10220, baseId: 851, formLabel: 'Gigantamax', typeIds: ['10', '7'], formTrait: 'gigantamax' },
    { id: 10221, baseId: 858, formLabel: 'Gigantamax', typeIds: ['14', '18'], formTrait: 'gigantamax' },
    { id: 10222, baseId: 861, formLabel: 'Gigantamax', typeIds: ['17', '18'], formTrait: 'gigantamax' },
    { id: 10223, baseId: 869, formLabel: 'Gigantamax', typeIds: ['18'], formTrait: 'gigantamax' },
    { id: 10224, baseId: 879, formLabel: 'Gigantamax', typeIds: ['9'], formTrait: 'gigantamax' },
    { id: 10225, baseId: 884, formLabel: 'Gigantamax', typeIds: ['9', '16'], formTrait: 'gigantamax' },
    { id: 10226, baseId: 892, formLabel: 'Single Strike Gmax', typeIds: ['2', '17'], formTrait: 'gigantamax' },
    { id: 10227, baseId: 892, formLabel: 'Rapid Strike Gmax', typeIds: ['2', '11'], formTrait: 'gigantamax' },
    // Hisuian Regional Forms & Origin Dialga/Palkia & Enamorus Therian
    { id: 10229, baseId: 58, formLabel: 'Hisui', typeIds: ['10', '6'], regionOverride: 'hisui' },
    { id: 10230, baseId: 59, formLabel: 'Hisui', typeIds: ['10', '6'], regionOverride: 'hisui' },
    { id: 10231, baseId: 100, formLabel: 'Hisui', typeIds: ['13', '12'], regionOverride: 'hisui' },
    { id: 10232, baseId: 101, formLabel: 'Hisui', typeIds: ['13', '12'], regionOverride: 'hisui' },
    { id: 10233, baseId: 157, formLabel: 'Hisui', typeIds: ['10', '8'], regionOverride: 'hisui' },
    { id: 10234, baseId: 211, formLabel: 'Hisui', typeIds: ['17', '4'], regionOverride: 'hisui' },
    { id: 10235, baseId: 215, formLabel: 'Hisui', typeIds: ['2', '4'], regionOverride: 'hisui' },
    { id: 10236, baseId: 503, formLabel: 'Hisui', typeIds: ['11', '17'], regionOverride: 'hisui' },
    { id: 10237, baseId: 549, formLabel: 'Hisui', typeIds: ['12', '2'], regionOverride: 'hisui' },
    { id: 10238, baseId: 570, formLabel: 'Hisui', typeIds: ['1', '8'], regionOverride: 'hisui' },
    { id: 10239, baseId: 571, formLabel: 'Hisui', typeIds: ['1', '8'], regionOverride: 'hisui' },
    { id: 10240, baseId: 628, formLabel: 'Hisui', typeIds: ['14', '3'], regionOverride: 'hisui' },
    { id: 10241, baseId: 705, formLabel: 'Hisui', typeIds: ['9', '16'], regionOverride: 'hisui' },
    { id: 10242, baseId: 706, formLabel: 'Hisui', typeIds: ['9', '16'], regionOverride: 'hisui' },
    { id: 10243, baseId: 713, formLabel: 'Hisui', typeIds: ['15', '6'], regionOverride: 'hisui' },
    { id: 10244, baseId: 724, formLabel: 'Hisui', typeIds: ['12', '2'], regionOverride: 'hisui' },
    { id: 10245, baseId: 483, formLabel: 'Origin', typeIds: ['9', '16'] },
    { id: 10246, baseId: 484, formLabel: 'Origin', typeIds: ['11', '16'] },
    { id: 10249, baseId: 905, formLabel: 'Therian', typeIds: ['18', '3'] },
    // Paldean Regional Forms, Bloodmoon Ursaluna, Ogerpon Masks, Terapagos
    { id: 10250, baseId: 128, formLabel: 'Paldea Combat', typeIds: ['2'], regionOverride: 'paldea' },
    { id: 10251, baseId: 128, formLabel: 'Paldea Blaze', typeIds: ['2', '10'], regionOverride: 'paldea' },
    { id: 10252, baseId: 128, formLabel: 'Paldea Aqua', typeIds: ['2', '11'], regionOverride: 'paldea' },
    { id: 10253, baseId: 194, formLabel: 'Paldea', typeIds: ['4', '5'], regionOverride: 'paldea' },
    { id: 10272, baseId: 901, formLabel: 'Bloodmoon', typeIds: ['5', '1'], regionOverride: 'paldea' },
    { id: 10273, baseId: 1017, formLabel: 'Wellspring', typeIds: ['12', '11'] },
    { id: 10274, baseId: 1017, formLabel: 'Hearthflame', typeIds: ['12', '10'] },
    { id: 10275, baseId: 1017, formLabel: 'Cornerstone', typeIds: ['12', '6'] },
    { id: 10276, baseId: 1024, formLabel: 'Terastal', typeIds: ['1'] },
    { id: 10277, baseId: 1024, formLabel: 'Stellar', typeIds: ['1'] }
];

/**
 * @brief Evaluates whether an alternate form matches a given SudokuRestriction
 */
export function doesFormMatchRestriction(
    formDef: SudokuAlternateFormDef,
    basePokemon: PokemonEntry,
    restriction: SudokuRestriction
): boolean {
    switch (restriction.category) {
        case 'type':
            return formDef.typeIds.includes(String(restriction.value));
        case 'dualType':
            return formDef.typeIds.length === 2;
        case 'monotype':
            return formDef.typeIds.length === 1;
        case 'region': {
            if (formDef.regionOverride) {
                return formDef.regionOverride === restriction.value;
            }
            const range = REGION_RANGES[restriction.value];
            if (!range) return false;
            return formDef.baseId >= range.min && formDef.baseId <= range.max;
        }
        case 'mega':
            return formDef.formTrait === 'mega';
        case 'primal':
            return formDef.formTrait === 'primal';
        case 'gigantamax':
            return formDef.formTrait === 'gigantamax';
        default:
            return doesPokemonMatchRestriction(basePokemon, restriction);
    }
}
