import { Pokemon, PokemonListResponse } from '../types/pokemon';

const BASE_URL = 'https://pokeapi.co/api/v2';

export async function fetchPokemonList(
  limit: number = 20,
  offset: number = 0
): Promise<PokemonListResponse> {
  const response = await fetch(
    `${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch Pokemon list');
  }
  return response.json();
}

export async function fetchPokemon(nameOrId: string | number): Promise<Pokemon> {
  const response = await fetch(`${BASE_URL}/pokemon/${nameOrId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch Pokemon: ${nameOrId}`);
  }
  return response.json();
}

export function getPokemonIdFromUrl(url: string): number {
  const matches = url.match(/\/pokemon\/(\d+)\//);
  return matches ? parseInt(matches[1], 10) : 0;
}

export function getPokemonImageUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

export function formatPokemonId(id: number): string {
  return `#${id.toString().padStart(3, '0')}`;
}

export function formatPokemonName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ');
}
