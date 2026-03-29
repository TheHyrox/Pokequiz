import { generationToId } from './utils/utils';

export async function getPokemonDescription(pokemon : string, languageId: string, generation: string | null) {
    const url = `https://pokeapi.co/api/v2/pokemon-species/${pokemon}/`;

    let generationId : number[] | null = null;
    let descriptions : string[] = [];
    const langId = parseInt(languageId);

    if (generation != null) {
        generationId = await generationToId(generation);
    }
    
    try {
        const response = await fetch(url);
        const data = await response.json();

        data.flavor_text_entries.forEach((entry: { language: { url: string; }; flavor_text: string; version: { url: string; }; }) => {
            // Get language ID from the URL
            const entryLangId = parseInt(entry.language.url.split('/').filter((part: string) => part).pop() || '0');
            
            if (generationId == null && generation == null) {
                if (entryLangId === langId) {
                    descriptions.push(entry.flavor_text.replace(/\n/g, ' '));
                }
            } else if (generationId != null) {
                for (let i = 0; i < generationId.length; i++) {
                    if (entryLangId === langId && entry.version.url.endsWith(`/${generationId[i]}/`)) {
                        descriptions.push(entry.flavor_text.replace(/\n/g, ' '));
                    }
                }
            }
        });

        return await noSpoilerDescription(descriptions, languageId, data);
    } catch (e) {
        console.log("Got an error: ", e);
    }
}

async function noSpoilerDescription(descriptions : string[], lang: string, data: any) {
    let nameLocalized = data.names.find((name: { language: { url: string; }; }) => name.language.url.endsWith(`/${lang}/`));
    let placeHolder = '';

    switch (lang) {
        case "1":
            placeHolder = "このポケモン";
            break;
        case "3": 
            placeHolder = "이 포켓몬";
            break;
        case "4":
            placeHolder = "這隻寶可夢";
            break;
        case "5":
            placeHolder = "ce Pokémon";
            break;
        case "6":
            placeHolder = "dieses Pokémon";
            break;
        case "7":
            placeHolder = "este Pokémon";
            break;
        case "8":
            placeHolder = "questo Pokémon" 
            break;
        case "9":
            placeHolder = "this pokemon";
            break;
        case "11":
            placeHolder = "このポケモン";
            break;
        case "12":
            placeHolder = "这只宝可梦";
            break;
        default:
            placeHolder = "this pokemon";
    }

    for (let i = 0; i < descriptions.length; i++) {
        descriptions[i] = descriptions[i].replace(new RegExp(nameLocalized.name, 'gi'), placeHolder);
    }

    return await deleteDupplicateDescriptions(descriptions);
}

async function deleteDupplicateDescriptions(descriptions : string[]) {
    let uniqueDescriptions : string[] = [];

    descriptions.forEach(description => {
        if (!uniqueDescriptions.includes(description)) {
            uniqueDescriptions.push(description);
        }
    });

    return uniqueDescriptions;
}

export function truncateDescription(description: string, strength: number): string {
    const words = description.split(' ');
    const maskedWords = words.map((word, index) => {
        let shouldMask = false;
        
        if (strength === 1 && index % 2 === 0) {
            shouldMask = true;
        } else if (strength === 2 && index % 3 === 0) {
            shouldMask = true;
        } else if (strength === 3 && index % 4 === 0) {
            shouldMask = true;
        }
        
        if (shouldMask) {
            return '█'.repeat(Math.max(word.length, 1));
        }
        return word;
    });
    
    return maskedWords.join(' ');
}

export function scrambleDescription(description: string): string {
    const words = description.split(' ');
    const algorithm = Math.floor(Math.random() * 5);
    
    let scrambledWords = [...words];
    
    switch (algorithm) {
        case 0: // Alphabetical order
            scrambledWords.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
            break;
        case 1: // Shortest to longest
            scrambledWords.sort((a, b) => a.length - b.length);
            break;
        case 2: // Longest to shortest
            scrambledWords.sort((a, b) => b.length - a.length);
            break;
        case 3: // Most vowels first
            scrambledWords.sort((a, b) => {
                const vowelsA = (a.match(/[aeiouàâäæëéèêïîôöœùûüœAEIOUÀÂÄÆËÉÈÊÏÎÔÖŒÙÛÜŒ]/gi) || []).length;
                const vowelsB = (b.match(/[aeiouàâäæëéèêïîôöœùûüœAEIOUÀÂÄÆËÉÈÊÏÎÔÖŒÙÛÜŒ]/gi) || []).length;
                return vowelsB - vowelsA;
            });
            break;
        case 4: // Complete chaos
            for (let i = scrambledWords.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [scrambledWords[i], scrambledWords[j]] = [scrambledWords[j], scrambledWords[i]];
            }
            break;
    }
    
    return scrambledWords.join(' ');
}
