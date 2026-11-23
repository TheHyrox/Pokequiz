/**
 * @brief URL Query Parameter Encoding & Decoding for Shareable Quiz Settings
 * @description Allows encoding any quiz's ruleset into URL query parameters
 *              (e.g. ?quiz=sprites&gen=1,2&silhouette=1&hardcore=1) so friends can play
 *              the exact same custom ruleset or daily challenge.
 */

import {
    ALL_GENERATIONS,
    ALL_INFORMATION_TYPES,
    ALL_POKEDLE_COLUMNS,
    DEFAULT_QUIZ_SETTINGS,
    DEFAULT_SPRITE_QUIZ_SETTINGS,
    DEFAULT_INFORMATION_QUIZ_SETTINGS,
    DEFAULT_POKEDLE_QUIZ_SETTINGS,
    DEFAULT_NUMBER_QUIZ_SETTINGS
} from '../../../shared/constants';
import type {
    DescriptionQuizSettings,
    SpriteQuizSettings,
    InformationQuizSettings,
    PokedleQuizSettings,
    NumberQuizSettings,
    GameMode,
    InformationGameMode,
    InformationType,
    PokedleColumn,
    SpriteType,
    SpriteSource,
    NumberQuizSubMode
} from '../../../shared/types';
import { getTodayDateString } from '../../../shared/utils/seededRng';

export type QuizSlug = 'description' | 'information' | 'sprites' | 'pokedle' | 'number';

export interface ParsedUrlQuizConfig {
    quizSlug: QuizSlug;
    settings: any;
    autoStart: boolean;
}

function parseGenerations(genParam: string | null): number[] {
    if (!genParam) return [...ALL_GENERATIONS];
    const gens = genParam
        .split(',')
        .map(s => parseInt(s.trim(), 10))
        .filter(n => !isNaN(n) && ALL_GENERATIONS.includes(n));
    return gens.length > 0 ? Array.from(new Set(gens)) : [...ALL_GENERATIONS];
}

function parseBool(val: string | null, fallback: boolean): boolean {
    if (val === null || val === undefined || val === '') return fallback;
    const lower = val.toLowerCase();
    if (lower === '1' || lower === 'true' || lower === 'yes') return true;
    if (lower === '0' || lower === 'false' || lower === 'no') return false;
    return fallback;
}

function parseIntClamped(val: string | null, min: number, max: number, fallback: number): number {
    if (!val) return fallback;
    const parsed = parseInt(val, 10);
    if (isNaN(parsed)) return fallback;
    return Math.max(min, Math.min(max, parsed));
}

/**
 * @brief Encodes a quiz slug and its settings into URL search parameters
 */
export function encodeQuizSettingsToParams(
    quizSlug: QuizSlug,
    settings: any,
    extra?: { play?: boolean }
): URLSearchParams {
    const params = new URLSearchParams();
    params.set('quiz', quizSlug);

    const gens: number[] = settings?.selectedGenerations ?? ALL_GENERATIONS;
    if (gens.length > 0) {
        params.set('gen', [...gens].sort((a, b) => a - b).join(','));
    }

    if (settings?.isDailyChallenge) {
        params.set('daily', '1');
        if (settings.dailySeed) {
            params.set('seed', settings.dailySeed);
        }
    }

    switch (quizSlug) {
        case 'sprites': {
            const s = settings as SpriteQuizSettings;
            params.set('mode', s.gameMode);
            if (s.gameMode === 'hardcore') params.set('hardcore', '1');
            if (s.hasTimeLimit) {
                params.set('timer', '1');
                params.set('time', String(s.timeLimit));
            }
            if (s.selectedSpriteTypes?.length) {
                params.set('types', s.selectedSpriteTypes.join(','));
            }
            if (s.spriteSource) {
                params.set('source', s.spriteSource);
            }
            params.set('options', String(s.numberOfOptions ?? 4));
            if (s.effects) {
                params.set('blur', s.effects.blurEnabled ? '1' : '0');
                if (s.effects.blurEnabled) params.set('blurStrength', String(s.effects.blurStrength));
                if (s.effects.pixelateEnabled) {
                    params.set('pixelate', '1');
                    params.set('pixelateStrength', String(s.effects.pixelateStrength));
                }
                if (s.effects.silhouetteEnabled) params.set('silhouette', '1');
                if (s.effects.rotationEnabled) params.set('rotation', '1');
            }
            break;
        }
        case 'description': {
            const s = settings as DescriptionQuizSettings;
            params.set('mode', s.gameMode);
            if (s.gameMode === 'hardcore') params.set('hardcore', '1');
            if (s.hasTimeLimit) {
                params.set('timer', '1');
                params.set('time', String(s.timeLimit));
            }
            if (s.changeDescription) params.set('changeDesc', '1');
            if (s.truncateStrength > 0) params.set('truncate', String(s.truncateStrength));
            if (s.enableScramble) params.set('scramble', '1');
            params.set('options', String(s.numberOfOptions ?? 4));
            break;
        }
        case 'information': {
            const s = settings as InformationQuizSettings;
            params.set('mode', s.gameMode);
            if (s.gameMode === 'hardcore') params.set('hardcore', '1');
            if (s.hasTimeLimit) {
                params.set('timer', '1');
                params.set('time', String(s.timeLimit));
            }
            if (s.selectedInformations?.length) {
                params.set('infos', s.selectedInformations.join(','));
            }
            params.set('options', String(s.numberOfOptions ?? 10));
            if (s.showSprites) params.set('sprites', '1');
            if (s.enableFakeInformation) {
                params.set('fake', '1');
                params.set('fakeRate', String(s.fakeInformationRate));
            }
            break;
        }
        case 'pokedle': {
            const s = settings as PokedleQuizSettings;
            params.set('guessLimit', String(s.guessLimit ?? 8));
            if (s.selectedColumns?.length && s.selectedColumns.length !== ALL_POKEDLE_COLUMNS.length) {
                params.set('cols', s.selectedColumns.join(','));
            }
            params.set('indicators', s.showMoreLessIndicators ? '1' : '0');
            break;
        }
        case 'number': {
            const s = settings as NumberQuizSettings;
            params.set('subMode', s.subMode);
            params.set('hasGuessLimit', s.hasGuessLimit ? '1' : '0');
            params.set('guessLimit', String(s.guessLimit ?? 8));
            params.set('higherLower', s.showHigherLower ? '1' : '0');
            if (s.blurEnabled) {
                params.set('blur', '1');
                params.set('blurStrength', String(s.blurStrength));
            }
            if (s.pixelateEnabled) {
                params.set('pixelate', '1');
                params.set('pixelateStrength', String(s.pixelateStrength));
            }
            if (s.silhouetteEnabled) params.set('silhouette', '1');
            if (s.rotationEnabled) params.set('rotation', '1');
            break;
        }
    }

    if (extra?.play) {
        params.set('play', '1');
    }

    return params;
}

/**
 * @brief Builds a full shareable URL string for the current origin
 */
export function buildShareableQuizUrl(
    quizSlug: QuizSlug,
    settings: any,
    playImmediately: boolean = false
): string {
    const params = encodeQuizSettingsToParams(quizSlug, settings, { play: playImmediately });
    const base = typeof window !== 'undefined'
        ? `${window.location.origin}${window.location.pathname}`
        : 'http://localhost:3000/';
    const hash = playImmediately ? `#/${quizSlug}/play` : `#/${quizSlug}`;
    return `${base}?${params.toString()}${hash}`;
}

/**
 * @brief Decodes URL query parameters (and optional hash) into a quiz slug and settings object
 */
export function parseQuizSettingsFromUrl(searchStr?: string, hashStr?: string): ParsedUrlQuizConfig | null {
    if (typeof window === 'undefined' && !searchStr) return null;
    const rawSearch = searchStr ?? window.location.search;
    const rawHash = hashStr ?? window.location.hash;

    // Also support query params embedded inside hash like #/sprites?gen=1,2
    let querySource = rawSearch;
    if (!querySource && rawHash.includes('?')) {
        querySource = '?' + rawHash.split('?')[1];
    }

    if (!querySource || querySource === '?') return null;
    const params = new URLSearchParams(querySource);

    // Determine quiz slug from ?quiz= or from hash #/<slug>
    let quizParam = params.get('quiz')?.toLowerCase().trim() || '';
    if (quizParam.endsWith('-quiz')) {
        quizParam = quizParam.replace(/-quiz$/, '');
    }

    if (!quizParam && rawHash) {
        const cleanHash = rawHash.replace(/^#\/?/, '').split('?')[0];
        const [hashSlug] = cleanHash.split('/');
        if (['description', 'information', 'sprites', 'pokedle', 'number'].includes(hashSlug)) {
            quizParam = hashSlug;
        }
    }

    if (!['description', 'information', 'sprites', 'pokedle', 'number'].includes(quizParam)) {
        return null;
    }

    const quizSlug = quizParam as QuizSlug;
    const selectedGenerations = parseGenerations(params.get('gen') ?? params.get('generations'));
    const isDailyChallenge = parseBool(params.get('daily'), false);
    const dailySeed = params.get('seed') || (isDailyChallenge ? getTodayDateString() : undefined);
    const isHardcoreFlag = parseBool(params.get('hardcore'), false);
    const autoStart =
        parseBool(params.get('play') ?? params.get('start'), false) ||
        isDailyChallenge ||
        rawHash.includes('/play');

    switch (quizSlug) {
        case 'sprites': {
            const def = DEFAULT_SPRITE_QUIZ_SETTINGS;
            let gameMode: GameMode = def.gameMode;
            const modeParam = params.get('mode') as GameMode | null;
            if (isHardcoreFlag) {
                gameMode = 'hardcore';
            } else if (modeParam && ['score', 'infinite', 'challenge', 'hardcore'].includes(modeParam)) {
                gameMode = modeParam;
            }

            const hasTimeLimit = gameMode === 'hardcore' ? false : parseBool(params.get('timer') ?? params.get('hasTimeLimit'), def.hasTimeLimit);
            const timeLimit = parseIntClamped(params.get('time') ?? params.get('timeLimit'), 5, 30, def.timeLimit);

            const typesRaw = params.get('types');
            const parsedTypes = typesRaw
                ? (typesRaw.split(',').filter(t => t === 'front' || t === 'back') as SpriteType[])
                : [];
            const selectedSpriteTypes: SpriteType[] = parsedTypes.length > 0 ? parsedTypes : [...def.selectedSpriteTypes];

            const sourceParam = params.get('source') as SpriteSource | null;
            const spriteSource: SpriteSource =
                sourceParam && ['default', 'home', 'official'].includes(sourceParam) ? sourceParam : def.spriteSource;

            const blurEnabled = parseBool(params.get('blur'), def.effects.blurEnabled);
            const blurStrength = parseIntClamped(params.get('blurStrength'), 1, 20, def.effects.blurStrength);
            const pixelateEnabled = parseBool(params.get('pixelate'), def.effects.pixelateEnabled);
            const pixelateStrength = parseIntClamped(params.get('pixelateStrength'), 2, 25, def.effects.pixelateStrength);
            const silhouetteEnabled = parseBool(params.get('silhouette'), def.effects.silhouetteEnabled);
            const rotationEnabled = parseBool(params.get('rotation'), def.effects.rotationEnabled);
            const numberOfOptions = parseIntClamped(params.get('options'), 2, 24, def.numberOfOptions);

            const settings: SpriteQuizSettings = {
                hasTimeLimit,
                timeLimit,
                gameMode,
                selectedGenerations,
                selectedSpriteTypes,
                spriteSource,
                effects: {
                    blurEnabled,
                    blurStrength,
                    pixelateEnabled,
                    pixelateStrength,
                    silhouetteEnabled,
                    rotationEnabled
                },
                numberOfOptions
            };
            return { quizSlug, settings, autoStart };
        }

        case 'description': {
            const def = DEFAULT_QUIZ_SETTINGS;
            let gameMode: GameMode = def.gameMode;
            const modeParam = params.get('mode') as GameMode | null;
            if (isHardcoreFlag) {
                gameMode = 'hardcore';
            } else if (modeParam && ['score', 'infinite', 'challenge', 'hardcore'].includes(modeParam)) {
                gameMode = modeParam;
            }

            const hasTimeLimit = gameMode === 'hardcore' ? false : parseBool(params.get('timer') ?? params.get('hasTimeLimit'), def.hasTimeLimit);
            const timeLimit = parseIntClamped(params.get('time') ?? params.get('timeLimit'), 5, 30, def.timeLimit);
            const changeDescription = parseBool(params.get('changeDesc') ?? params.get('changeDescription'), def.changeDescription);
            const truncateStrength = parseIntClamped(params.get('truncate') ?? params.get('truncateStrength'), 0, 3, def.truncateStrength);
            const enableScramble = parseBool(params.get('scramble') ?? params.get('enableScramble'), def.enableScramble);
            const numberOfOptions = parseIntClamped(params.get('options'), 2, 24, def.numberOfOptions);

            const settings: DescriptionQuizSettings = {
                hasTimeLimit,
                timeLimit,
                gameMode,
                changeDescription,
                selectedGenerations,
                truncateStrength,
                enableScramble,
                numberOfOptions,
                isDailyChallenge,
                dailySeed
            };
            return { quizSlug, settings, autoStart };
        }

        case 'information': {
            const def = DEFAULT_INFORMATION_QUIZ_SETTINGS;
            let gameMode: InformationGameMode = def.gameMode;
            const modeParam = params.get('mode') as InformationGameMode | null;
            if (isHardcoreFlag) {
                gameMode = 'hardcore';
            } else if (modeParam && ['easy', 'normal', 'challenge', 'hardcore'].includes(modeParam)) {
                gameMode = modeParam;
            }

            const hasTimeLimit = gameMode === 'hardcore' ? true : parseBool(params.get('timer') ?? params.get('hasTimeLimit'), def.hasTimeLimit);
            const timeLimit = gameMode === 'hardcore' ? 30 : parseIntClamped(params.get('time') ?? params.get('timeLimit'), 5, 60, def.timeLimit);

            const infosRaw = params.get('infos');
            const parsedInfos = infosRaw
                ? (infosRaw.split(',').filter(i => ALL_INFORMATION_TYPES.includes(i as InformationType)) as InformationType[])
                : [];
            const selectedInformations = parsedInfos.length >= 3 ? parsedInfos : [...def.selectedInformations];

            const numberOfOptions = parseIntClamped(params.get('options'), 2, 24, def.numberOfOptions);
            const showSprites = parseBool(params.get('sprites') ?? params.get('showSprites'), def.showSprites);
            const enableFakeInformation = parseBool(params.get('fake') ?? params.get('enableFakeInformation'), def.enableFakeInformation);
            const fakeInformationRate = parseIntClamped(params.get('fakeRate'), 1, 100, def.fakeInformationRate);

            const settings: InformationQuizSettings = {
                hasTimeLimit,
                timeLimit,
                gameMode,
                selectedGenerations,
                selectedInformations,
                numberOfOptions,
                showSprites,
                enableFakeInformation,
                fakeInformationRate
            };
            return { quizSlug, settings, autoStart };
        }

        case 'pokedle': {
            const def = DEFAULT_POKEDLE_QUIZ_SETTINGS;
            const guessLimit = parseIntClamped(params.get('guessLimit') ?? params.get('guesses'), 5, 10, def.guessLimit);
            const colsRaw = params.get('cols');
            const parsedCols = colsRaw
                ? (colsRaw.split(',').filter(c => ALL_POKEDLE_COLUMNS.includes(c as PokedleColumn)) as PokedleColumn[])
                : [];
            const selectedColumns = parsedCols.length > 0 ? parsedCols : [...ALL_POKEDLE_COLUMNS];
            const showMoreLessIndicators = parseBool(params.get('indicators'), def.showMoreLessIndicators);

            const settings: PokedleQuizSettings = {
                guessLimit,
                selectedGenerations,
                selectedColumns,
                showMoreLessIndicators,
                isDailyChallenge,
                dailySeed
            };
            return { quizSlug, settings, autoStart };
        }

        case 'number': {
            const def = DEFAULT_NUMBER_QUIZ_SETTINGS;
            const subModeParam = (params.get('subMode') ?? params.get('mode')) as NumberQuizSubMode | null;
            const subMode: NumberQuizSubMode =
                subModeParam && ['normal', 'points'].includes(subModeParam) ? subModeParam : def.subMode;
            const hasGuessLimit = parseBool(params.get('hasGuessLimit'), def.hasGuessLimit);
            const guessLimit = parseIntClamped(params.get('guessLimit') ?? params.get('guesses'), 5, 10, def.guessLimit);
            const showHigherLower = parseBool(params.get('higherLower'), def.showHigherLower);
            const blurEnabled = parseBool(params.get('blur'), def.blurEnabled);
            const blurStrength = parseIntClamped(params.get('blurStrength'), 1, 20, def.blurStrength);
            const pixelateEnabled = parseBool(params.get('pixelate'), def.pixelateEnabled);
            const pixelateStrength = parseIntClamped(params.get('pixelateStrength'), 2, 25, def.pixelateStrength);
            const silhouetteEnabled = parseBool(params.get('silhouette'), def.silhouetteEnabled);
            const rotationEnabled = parseBool(params.get('rotation'), def.rotationEnabled);

            const settings: NumberQuizSettings = {
                subMode,
                hasGuessLimit,
                guessLimit,
                selectedGenerations,
                showHigherLower,
                blurEnabled,
                blurStrength,
                pixelateEnabled,
                pixelateStrength,
                silhouetteEnabled,
                rotationEnabled,
                isDailyChallenge,
                dailySeed
            };
            return { quizSlug, settings, autoStart };
        }
    }
}
