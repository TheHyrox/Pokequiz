import { generationToId } from './utils/utils';

export async function getPokemonDescription(pokemon : string, lang: string, generation: string | null) {
    const url = `https://pokeapi.co/api/v2/pokemon-species/${pokemon}/`;

    let generationId : number[] | null = null;
    let descriptions : string[] = [];

    if (generation != null) {
        generationId = await generationToId(generation);
    }
    
    try {
        const response = await fetch(url);
        const data = await response.json();

        data.flavor_text_entries.forEach((entry: { language: { url: string; }; flavor_text: string; version: { url: string; }; }) => {
            if (generationId == null && generation == null) {
                if (entry.language.url.endsWith(`/${lang}/`)) {
                    descriptions.push(entry.flavor_text.replace(/\n/g, ' '));
                }
            } else if (generationId != null) {
                for (let i = 0; i < generationId.length; i++) {
                    if (entry.language.url.endsWith(`/${lang}/`) && entry.version.url.endsWith(`/${generationId[i]}/`)) {
                        descriptions.push(entry.flavor_text.replace(/\n/g, ' '));
                    }
                }
            }
        });

        return descriptions;
    } catch (e) {
        console.log("Got an error: ", e);
    }
}