import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  RefreshControl,
  Animated,
  Dimensions,
  TouchableOpacity,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PokemonCard } from './src/components/PokemonCard';
import { PokemonDetailModal } from './src/components/PokemonDetailModal';
import { WhosThatPokemon } from './src/components/WhosThatPokemon';
import { fetchPokemonList, fetchPokemon } from './src/api/pokemon';
import { Pokemon, PokemonListItem } from './src/types/pokemon';

const PAGE_SIZE = 20;

export default function App() {
  const [pokemonList, setPokemonList] = useState<PokemonListItem[]>([]);
  const [filteredList, setFilteredList] = useState<PokemonListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [showCatchAnimation, setShowCatchAnimation] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);

  const pokeballScale = useRef(new Animated.Value(0)).current;
  const pokeballRotate = useRef(new Animated.Value(0)).current;
  const pokeballOpacity = useRef(new Animated.Value(0)).current;

  const loadPokemon = useCallback(async (reset: boolean = false) => {
    try {
      const currentOffset = reset ? 0 : offset;
      const response = await fetchPokemonList(PAGE_SIZE, currentOffset);

      if (reset) {
        setPokemonList(response.results);
        setFilteredList(response.results);
        setOffset(PAGE_SIZE);
      } else {
        setPokemonList((prev) => [...prev, ...response.results]);
        setFilteredList((prev) => [...prev, ...response.results]);
        setOffset((prev) => prev + PAGE_SIZE);
      }

      setHasMore(response.next !== null);
    } catch (error) {
      console.error('Error loading Pokemon:', error);
    }
  }, [offset]);

  useEffect(() => {
    const initialLoad = async () => {
      setLoading(true);
      await loadPokemon(true);
      setLoading(false);
    };
    initialLoad();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredList(pokemonList);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredList(
        pokemonList.filter((p) => p.name.toLowerCase().includes(query))
      );
    }
  }, [searchQuery, pokemonList]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPokemon(true);
    setRefreshing(false);
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || searchQuery.trim() !== '') return;
    setLoadingMore(true);
    await loadPokemon(false);
    setLoadingMore(false);
  };

  const playCatchAnimation = (): Promise<void> => {
    return new Promise((resolve) => {
      setShowCatchAnimation(true);
      pokeballScale.setValue(0);
      pokeballRotate.setValue(0);
      pokeballOpacity.setValue(1);

      Animated.sequence([
        Animated.parallel([
          Animated.spring(pokeballScale, {
            toValue: 1,
            friction: 4,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.timing(pokeballRotate, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(pokeballRotate, { toValue: 0.8, duration: 100, useNativeDriver: true }),
          Animated.timing(pokeballRotate, { toValue: 1.2, duration: 100, useNativeDriver: true }),
          Animated.timing(pokeballRotate, { toValue: 0.9, duration: 100, useNativeDriver: true }),
          Animated.timing(pokeballRotate, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]),
        Animated.timing(pokeballOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowCatchAnimation(false);
        resolve();
      });
    });
  };

  const handlePokemonPress = async (id: number) => {
    await playCatchAnimation();
    setModalVisible(true);
    setModalLoading(true);
    try {
      const pokemon = await fetchPokemon(id);
      setSelectedPokemon(pokemon);
    } catch (error) {
      console.error('Error loading Pokemon details:', error);
    }
    setModalLoading(false);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedPokemon(null);
  };

  const renderPokemon = ({ item }: { item: PokemonListItem }) => (
    <PokemonCard pokemon={item} onPress={handlePokemonPress} />
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#E63946" />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Pokédex</Text>
          <TouchableOpacity
            style={styles.quizButton}
            onPress={() => setShowQuiz(true)}
            accessibilityLabel="Who's That Pokémon?"
          >
            <Text style={styles.quizButtonText}>🎲</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>
          Search for a Pokémon by name
        </Text>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search Pokémon..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E63946" />
          <Text style={styles.loadingText}>Loading Pokémon...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredList}
          renderItem={renderPokemon}
          keyExtractor={(item) => item.name}
          numColumns={2}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#E63946']}
              tintColor="#E63946"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No Pokémon found</Text>
            </View>
          }
        />
      )}

      <PokemonDetailModal
        pokemon={selectedPokemon}
        visible={modalVisible}
        loading={modalLoading}
        onClose={handleCloseModal}
      />

      <WhosThatPokemon
        visible={showQuiz}
        onClose={() => setShowQuiz(false)}
      />

      {showCatchAnimation && (
        <View style={styles.catchOverlay}>
          <Animated.View
            style={[
              styles.pokeball,
              {
                opacity: pokeballOpacity,
                transform: [
                  { scale: pokeballScale },
                  {
                    rotate: pokeballRotate.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['-30deg', '0deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.pokeballTop} />
            <View style={styles.pokeballMiddle}>
              <View style={styles.pokeballButton}>
                <View style={styles.pokeballButtonInner} />
              </View>
            </View>
            <View style={styles.pokeballBottom} />
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 40) + 8 : 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E63946',
  },
  quizButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E63946',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E63946',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  quizButtonText: {
    fontSize: 24,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#333',
  },
  list: {
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  catchOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  pokeball: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#1a1a1a',
  },
  pokeballTop: {
    flex: 1,
    backgroundColor: '#E63946',
  },
  pokeballMiddle: {
    height: 12,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pokeballButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  pokeballButtonInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#1a1a1a',
  },
  pokeballBottom: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
