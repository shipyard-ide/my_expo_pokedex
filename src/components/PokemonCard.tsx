import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  getPokemonIdFromUrl,
  getPokemonImageUrl,
  formatPokemonId,
  formatPokemonName,
} from '../api/pokemon';
import { PokemonListItem } from '../types/pokemon';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface PokemonCardProps {
  pokemon: PokemonListItem;
  onPress: (id: number) => void;
}

export function PokemonCard({ pokemon, onPress }: PokemonCardProps) {
  const id = getPokemonIdFromUrl(pokemon.url);
  const imageUrl = getPokemonImageUrl(id);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(id)}
      activeOpacity={0.7}
    >
      <Text style={styles.id}>{formatPokemonId(id)}</Text>
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
        resizeMode="contain"
      />
      <Text style={styles.name}>{formatPokemonName(pokemon.name)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    margin: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  id: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    alignSelf: 'flex-end',
  },
  image: {
    width: CARD_WIDTH - 40,
    height: CARD_WIDTH - 40,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
});
