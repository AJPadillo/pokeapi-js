export function getPokemon(id) {
    const url = `https://pokeapi.co/api/v2/pokemon/${id}`;
    return fetchData(url).then((data) => {
        if (!data) return;

        return {
            name: data.name,
            img: data.sprites.front_default,
            types: data.types.map(type => ({
                name: type.type.name,
                url: type.type.url
            })),
            abilities: data.abilities.map(ability => ({
                name: ability.ability.name,
                url: ability.ability.url
            })),
            moves: data.moves.map(move => ({
                name: move.move.name,
                url: move.move.url
            })),
            height: data.height,
            weight: data.weight,
        };
    });
}

export function translatePokemonTypes(pokemon) {
    const typesPromises = pokemon.types.map((type) => {
        return fetchData(type.url).then((data) => {
            const typeName = data.names.find(name => name.language.name === 'es');
            return typeName ? typeName.name : type.name;
        });
    });

    return Promise.all(typesPromises).then((translatedTypes) => {
        pokemon.types = translatedTypes;
        return pokemon;
    });
}

export function translatePokemonAbilities(pokemon) {
    const abilitiesPromises = pokemon.abilities.map((ability) => {
        return fetchData(ability.url).then((data) => {
            const abilityName = data.names.find(name => name.language.name === 'es');
            return abilityName ? abilityName.name : ability.name;
        });
    });

    return Promise.all(abilitiesPromises).then((translatedAbilities) => {
        pokemon.abilities = translatedAbilities;
        return pokemon;
    });
}

export function translatePokemonMoves(pokemon) {
    const batchSize = 10;
    const batches = [];
    for (let i = 0; i < pokemon.moves.length; i += batchSize) {
        batches.push(pokemon.moves.slice(i, i + batchSize));
    }

    return batches
        .reduce((chain, batch) => {
            return chain.then((results) => {
                const batchPromises = batch.map((move) => {
                    return fetchData(move.url).then((data) => {
                        const moveName = data.names.find(name => name.language.name === 'es');
                        return moveName ? moveName.name : move.name;
                    });
                });

                return Promise.allSettled(batchPromises).then((batchResults) => {
                    return results.concat(batchResults.map((result) => {
                        return result.status === 'fulfilled' ? result.value : 'Nombre no encontrado';
                    }));
                });
            });
        }, Promise.resolve([]))
        .then((translatedMoves) => {
            pokemon.moves = translatedMoves;
            return pokemon;
        });
}

export function renderPokemon(pokemon) {
    const list = document.getElementById('pokemon-list');
    const pokemonLi = document.createElement('li');
    pokemonLi.classList.add('pokemon-item');

    if (pokemon.notFound) {
        pokemonLi.innerHTML = `<h3>${pokemon.notFound}</h3>`;
    } else {
        pokemonLi.innerHTML = `
            <h3>${pokemon.name}</h3>
            <img src="${pokemon.img}" alt="Image of ${pokemon.name}">
            <p><b>Height: </b>${pokemon.height}</p>
            <p><b>Weight: </b>${pokemon.weight}</p>
            <p><b>Types: </b>${pokemon.types.join(', ')}</p>
            <p><b>Abilities: </b>${pokemon.abilities.join(', ')}</p>
            <p><b>Moves: </b>${pokemon.moves.join(', ')}</p>
        `;
    }

    list.appendChild(pokemonLi);
}

export async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}


export function searchAndRenderPokemon(searchValue) {
    const ids = searchValue.split(',').map(item => item.trim());

    clearSearchResults();

    const pokemonPromises = ids.map(id => {
        return getPokemon(id)
            .then((pokemon) => {
                if (!pokemon) {
                    return { notFound: `Pokémon con ID o nombre ${id} no encontrado.` };
                }
                return translatePokemonTypes(pokemon)
                    .then(translatePokemonAbilities)
                    .then(translatePokemonMoves);
            })
            .catch(() => {
                return { notFound: `Pokémon con ID o nombre ${id} no encontrado.` };
            });
    });

    Promise.all(pokemonPromises)
        .then((pokemons) => {
            pokemons.forEach(renderPokemon);
        })
        .catch((error) => {
            console.log('Error al obtener datos:', error.message);
        });
}

export function fillRandomSearch() {
    const randomNumbers = [];
    for (let i = 0; i < 4; i++) {
        randomNumbers.push(getRandomNumber(1, 1302));
    }
    document.getElementById('search-field').value = randomNumbers.join(',');
}

export function clearSearchResults() {
    const list = document.getElementById('pokemon-list');
    list.innerHTML = '';
}

export function init() {
    const searchButton = document.getElementById('search');
    const randomButton = document.getElementById('random');
    const clearButton = document.getElementById('clear');

    searchButton.addEventListener('click', () => {
        const searchValue = document.getElementById('search-field').value.trim();
        searchAndRenderPokemon(searchValue);
    });

    randomButton.addEventListener('click', () => {
        fillRandomSearch();
    });

    clearButton.addEventListener('click', () => {
        clearSearchResults();
    });
}

setTimeout(() => {
    init();
}, 200);
