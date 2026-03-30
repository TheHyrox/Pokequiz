/**
 * @brief Pokemon name API service
 * @description Fetches Pokemon names from PokeAPI
 */

/**
 * @brief Name entry with language information
 */
interface NameLocalized {
    name: string;
    language: string;
}

/**
 * @brief Fetches a single localized Pokemon name from PokeAPI
 * @param pokemon - Pokemon ID (National Pokedex number)
 * @param languageId - PokeAPI language ID
 * @returns Localized name string or null if not found
 * @example
 * await getPokemonNameLocalized(25, 9) // returns "Pikachu"
 * await getPokemonNameLocalized(25, 5) // returns "Pikachu" (French)
 */
export async function getPokemonNameLocalized(pokemon: number, languageId: number): Promise<string | null> {
    const url = `https://pokeapi.co/api/v2/pokemon-species/${pokemon}/`;

    try {
        const response = await fetch(url);
<<<<<<< HEAD
        const data = await response.json();
=======
        const data = await response.json() as { names: { name: string; language: { url: string } }[] };
>>>>>>> main

        const nameLocalized = data.names.find((name: { language: { url: string } }) => {
            const langId = name.language.url.split('/').filter((part: string) => part).pop();
            return langId ? parseInt(langId) === languageId : false;
        });

        return nameLocalized ? nameLocalized.name : null;
    } catch (e) {
        console.error('Error fetching Pokemon name:', e);
        return null;
    }
}

/**
 * @brief Fetches all localized names for a Pokemon
 * @param pokemon - Pokemon ID (National Pokedex number)
 * @returns Array of name/language pairs or null if request fails
 * @example
 * const names = await getPokemonNames(25);
 * // returns [{ name: "Pikachu", language: "9" }, { name: "Pikachu", language: "5" }, ...]
 */
export async function getPokemonNames(pokemon: number): Promise<NameLocalized[] | null> {
    const url = `https://pokeapi.co/api/v2/pokemon-species/${pokemon}/`;

    try {
        const response = await fetch(url);
<<<<<<< HEAD
        const data = await response.json();
=======
        const data = await response.json() as { names: { name: string; language: { url: string } }[] };
>>>>>>> main

        const nameLocalized: NameLocalized[] = [];

        for (const nameEntry of data.names) {
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
        console.error('Error fetching Pokemon names:', e);
        return null;
    }
}
