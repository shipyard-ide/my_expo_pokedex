import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PokemonCard } from './src/components/PokemonCard';
import { PokemonDetailModal } from './src/components/PokemonDetailModal';
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

  const handlePokemonPress = async (id: number) => {
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
        <Text style={styles.title}>Pokédex</Text>
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
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E63946',
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
});
