export async function generationToId(generation: string) {
    switch (generation) {
        case "1":
            return [32,31,46,45,44,3,2,1];
        case "2":
            return [6,5,4];
        case "3":
            return [11,10,9,8,7];
        case "4":
            return [39,38,37,16,15,14,13,12];
        case "5":
            return [22,21,18,17];
        case "6":
            return [26,25,24,23];
        case "7":
            return [30,29,28,27];
        case "8":
            return [36,35,34,33];
        case "9":
            return [43,42,41,40];
        default:
            return null;
    }
}

export function getRandomInt(max : number) {
  return Math.floor(Math.random() * max);
}

export const GENERATION_RANGES: Record<number, { min: number; max: number }> = {
    1: { min: 1, max: 151 },
    2: { min: 152, max: 251 },
    3: { min: 252, max: 386 },
    4: { min: 387, max: 493 },
    5: { min: 494, max: 649 },
    6: { min: 650, max: 721 },
    7: { min: 722, max: 809 },
    8: { min: 810, max: 905 },
    9: { min: 906, max: 1025 }
};

export function getRandomPokemonId(selectedGenerations: number[]): number {
    if (selectedGenerations.length === 0) {
        return getRandomInt(1025) + 1;
    }

    const validRanges = selectedGenerations
        .filter(gen => GENERATION_RANGES[gen])
        .map(gen => GENERATION_RANGES[gen]);

    if (validRanges.length === 0) {
        return getRandomInt(1025) + 1;
    }

    const randomRange = validRanges[Math.floor(Math.random() * validRanges.length)];
    const offset = Math.floor(Math.random() * (randomRange.max - randomRange.min + 1));
    return randomRange.min + offset;
}