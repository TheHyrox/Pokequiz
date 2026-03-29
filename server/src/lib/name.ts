import { generationToId } from './utils/utils';

export async function getPokemonNameLocalized(pokemon : number, lang: string) {
    const url = `https://pokeapi.co/api/v2/pokemon-species/${pokemon}/`;
    try {
        const response = await fetch(url);
        const data = await response.json();

        let nameLocalized = data.names.find((name: { language: { url: string; }; }) => name.language.url.endsWith(`/${lang}/`));
        return nameLocalized ? nameLocalized.name : null;
    } catch (e) {
        console.log("Got an error: ", e);
    }
}

export async function getPokemonNames(pokemon: number) {
    const url = `https://pokeapi.co/api/v2/pokemon-species/${pokemon}/`;
    try {
        const response = await fetch(url);
        const data = await response.json();

        interface NameLocalized {
            name: string;
            language: string;
        }
        let nameLocalized: NameLocalized[] = [];

        for (let i = 0; i < data.names.length; i++) {
            const nameEntry = data.names[i];
            const languageId = nameEntry.language.url.split('/').filter((part: string) => part).pop();

            if (languageId) {
                nameLocalized.push({
                    name: nameEntry.name,
                    language: languageId
                });
            }
        }

        return nameLocalized.length > 0 ? nameLocalized : null;
    } catch (e) {
        console.log("Got an error: ", e);
    }
}