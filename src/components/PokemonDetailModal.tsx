import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Pokemon, TYPE_COLORS } from '../types/pokemon';
import {
  formatPokemonId,
  formatPokemonName,
  getPokemonImageUrl,
} from '../api/pokemon';

interface PokemonDetailModalProps {
  pokemon: Pokemon | null;
  visible: boolean;
  loading: boolean;
  onClose: () => void;
}

export function PokemonDetailModal({
  pokemon,
  visible,
  loading,
  onClose,
}: PokemonDetailModalProps) {
  if (!visible) return null;

  const primaryType = pokemon?.types[0]?.type.name ?? 'normal';
  const backgroundColor = TYPE_COLORS[primaryType] ?? TYPE_COLORS.normal;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor }]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          ) : pokemon ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <Text style={styles.id}>{formatPokemonId(pokemon.id)}</Text>
              <Text style={styles.name}>
                {formatPokemonName(pokemon.name)}
              </Text>

              <View style={styles.typesContainer}>
                {pokemon.types.map((t) => (
                  <View
                    key={t.type.name}
                    style={[
                      styles.typeTag,
                      {
                        backgroundColor:
                          TYPE_COLORS[t.type.name] ?? TYPE_COLORS.normal,
                      },
                    ]}
                  >
                    <Text style={styles.typeText}>
                      {t.type.name.toUpperCase()}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: getPokemonImageUrl(pokemon.id) }}
                  style={styles.image}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoValue}>
                      {(pokemon.weight / 10).toFixed(1)} kg
                    </Text>
                    <Text style={styles.infoLabel}>Weight</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.infoItem}>
                    <Text style={styles.infoValue}>
                      {(pokemon.height / 10).toFixed(1)} m
                    </Text>
                    <Text style={styles.infoLabel}>Height</Text>
                  </View>
                </View>

                <Text style={styles.sectionTitle}>Base Stats</Text>
                {pokemon.stats.map((stat) => (
                  <View key={stat.stat.name} style={styles.statRow}>
                    <Text style={styles.statName}>
                      {formatStatName(stat.stat.name)}
                    </Text>
                    <Text style={styles.statValue}>{stat.base_stat}</Text>
                    <View style={styles.statBarContainer}>
                      <View
                        style={[
                          styles.statBar,
                          {
                            width: `${Math.min((stat.base_stat / 255) * 100, 100)}%`,
                            backgroundColor,
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))}

                <Text style={styles.sectionTitle}>Abilities</Text>
                <View style={styles.abilitiesContainer}>
                  {pokemon.abilities.map((a) => (
                    <View key={a.ability.name} style={styles.abilityTag}>
                      <Text style={styles.abilityText}>
                        {formatPokemonName(a.ability.name)}
                        {a.is_hidden ? ' (Hidden)' : ''}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function formatStatName(name: string): string {
  const statNames: Record<string, string> = {
    hp: 'HP',
    attack: 'ATK',
    defense: 'DEF',
    'special-attack': 'SpA',
    'special-defense': 'SpD',
    speed: 'SPD',
  };
  return statNames[name] ?? name.toUpperCase();
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    height: '90%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  id: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  name: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 4,
  },
  typesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  typeTag: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    opacity: 0.9,
  },
  typeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  image: {
    width: 200,
    height: 200,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    marginTop: 8,
    minHeight: 400,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  infoItem: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  divider: {
    width: 1,
    backgroundColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statName: {
    width: 40,
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  statValue: {
    width: 36,
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    textAlign: 'right',
    marginRight: 12,
  },
  statBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: '#eee',
    borderRadius: 3,
    overflow: 'hidden',
  },
  statBar: {
    height: '100%',
    borderRadius: 3,
  },
  abilitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  abilityTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  abilityText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});
