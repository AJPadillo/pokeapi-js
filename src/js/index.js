/**Pokemon api */
import "../styles/styles.css";

export function getPokemon(id) {
    const url = `https://pokeapi.co/api/v2/pokemon/${id}`;
    return fetchData(url).then((data) => {
        if (!data) return;

        return {
            name: data.name,
            img: data.sprites.front_default,
            types: data.types.map(type => type.type.name),
            abilities: data.abilities.map(ability => ability.ability.name),
            moves: data.moves.map(move => move.move.name),
            height: data.height,
            weight: data.weight,
        };
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

function fetchData(url) {
    return fetch(url)
        .then((response) => response.json())
        .catch((error) => {
            console.log(`error: ${error}`);
            throw error;
        });
}

export function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
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
        const ids = searchValue.split(',').map(item => item.trim());

        clearSearchResults();

        const pokemonPromises = ids.map(id => {
            return getPokemon(id)
                .then((pokemon) => {
                    if (!pokemon) {
                        return { notFound: `Pokémon con ID o nombre ${id} no encontrado.` };
                    }
                    return pokemon;
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
