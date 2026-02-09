import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  ActivityIndicator,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { fetchPokemon, getPokemonImageUrl, formatPokemonName, formatPokemonId } from '../api/pokemon';
import { Pokemon, TYPE_COLORS } from '../types/pokemon';

const MAX_POKEMON_ID = 151;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHOICE_LETTERS = ['A', 'B', 'C', 'D'];

interface WhosThatPokemonProps {
  visible: boolean;
  onClose: () => void;
}

export function WhosThatPokemon({ visible, onClose }: WhosThatPokemonProps) {
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [choices, setChoices] = useState<string[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);

  const revealAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const titlePulse = useRef(new Animated.Value(1)).current;
  const spotlightAnim = useRef(new Animated.Value(0)).current;

  const loadRandomPokemon = useCallback(async () => {
    setLoading(true);
    setRevealed(false);
    setSelectedChoice(null);
    revealAnim.setValue(0);
    bounceAnim.setValue(0);
    spotlightAnim.setValue(0);

    // Pulse the title
    Animated.loop(
      Animated.sequence([
        Animated.timing(titlePulse, { toValue: 1.05, duration: 800, useNativeDriver: true }),
        Animated.timing(titlePulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    try {
      const randomId = Math.floor(Math.random() * MAX_POKEMON_ID) + 1;
      const data = await fetchPokemon(randomId);
      setPokemon(data);

      const wrongIds = new Set<number>();
      while (wrongIds.size < 3) {
        const id = Math.floor(Math.random() * MAX_POKEMON_ID) + 1;
        if (id !== randomId) wrongIds.add(id);
      }
      const wrongNames = await Promise.all(
        [...wrongIds].map(async (id) => {
          const p = await fetchPokemon(id);
          return formatPokemonName(p.name);
        })
      );
      const allChoices = [...wrongNames, formatPokemonName(data.name)];
      for (let i = allChoices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allChoices[i], allChoices[j]] = [allChoices[j], allChoices[i]];
      }
      setChoices(allChoices);

      // Spotlight fade in
      Animated.timing(spotlightAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Error loading random Pokemon:', error);
    }
    setLoading(false);
  }, [revealAnim, bounceAnim, titlePulse, spotlightAnim]);

  useEffect(() => {
    if (visible) {
      setScore({ correct: 0, total: 0 });
      loadRandomPokemon();
    }
    return () => titlePulse.stopAnimation();
  }, [visible]);

  const handleGuess = (choice: string) => {
    if (revealed || !pokemon) return;
    setSelectedChoice(choice);
    const isCorrect = choice === formatPokemonName(pokemon.name);

    setScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));

    titlePulse.stopAnimation();
    titlePulse.setValue(1);
    setRevealed(true);
    Animated.parallel([
      Animated.timing(revealAnim, { toValue: 1, duration: 500, useNativeDriver: false }),
      Animated.spring(bounceAnim, { toValue: 1, friction: 3, tension: 100, useNativeDriver: true }),
    ]).start();
  };

  const imageUrl = pokemon ? getPokemonImageUrl(pokemon.id) : null;
  const primaryType = pokemon?.types[0]?.type.name ?? 'normal';
  const typeColor = TYPE_COLORS[primaryType] ?? '#A8A878';
  const isCorrect = selectedChoice != null && pokemon != null && selectedChoice === formatPokemonName(pokemon.name);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={{ width: 36 }} />
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Title banner */}
        <Animated.View style={[styles.titleBanner, { transform: [{ scale: titlePulse }] }]}>
          <Text style={styles.titleText}>WHO'S THAT</Text>
          <Text style={styles.titleTextAccent}>POKÉMON?</Text>
        </Animated.View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFD700" />
          </View>
        ) : (
          <>
            {/* Silhouette / Reveal area */}
            <Animated.View style={[styles.stageArea, { opacity: spotlightAnim }]}>
              <View style={[
                styles.spotlightCircle,
                revealed && { backgroundColor: typeColor + '25', borderColor: typeColor + '60' },
              ]}>
                {imageUrl && !revealed && (
                  <Image
                    source={{ uri: imageUrl }}
                    style={[styles.pokemonImage, styles.silhouette]}
                  />
                )}
                {imageUrl && revealed && (
                  <Animated.View style={{
                    transform: [{ scale: bounceAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.1] }) }],
                  }}>
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.pokemonImage}
                    />
                  </Animated.View>
                )}
                {!revealed && <Text style={styles.questionMark}>?</Text>}
              </View>

              {revealed && pokemon && (
                <Animated.View style={[styles.revealBanner, { opacity: revealAnim }]}>
                  <Text style={styles.itsText}>
                    {isCorrect ? "CORRECT!" : "It's"}
                  </Text>
                  <Text style={[styles.revealName, { color: typeColor }]}>
                    {formatPokemonName(pokemon.name).toUpperCase()}
                  </Text>
                  <Text style={styles.revealId}>{formatPokemonId(pokemon.id)}</Text>
                </Animated.View>
              )}
            </Animated.View>

            {/* Answer buttons */}
            <View style={styles.answersArea}>
              {choices.map((choice, idx) => {
                const isCorrectAnswer = pokemon ? choice === formatPokemonName(pokemon.name) : false;
                const isSelected = choice === selectedChoice;

                let bgColor = '#2a2a4a';
                let borderColor = '#3d3d6b';
                let letterBg = '#3d3d6b';
                let textColor = '#fff';

                if (revealed) {
                  if (isCorrectAnswer) {
                    bgColor = '#1a6b3a';
                    borderColor = '#2ecc71';
                    letterBg = '#2ecc71';
                  } else if (isSelected) {
                    bgColor = '#6b1a1a';
                    borderColor = '#E63946';
                    letterBg = '#E63946';
                  } else {
                    bgColor = '#1a1a2e';
                    borderColor = '#2a2a3e';
                    letterBg = '#2a2a3e';
                    textColor = '#555';
                  }
                }

                return (
                  <TouchableOpacity
                    key={choice}
                    style={[styles.answerButton, { backgroundColor: bgColor, borderColor }]}
                    onPress={() => handleGuess(choice)}
                    disabled={revealed}
                    accessibilityLabel={`${CHOICE_LETTERS[idx]}: ${choice}`}
                  >
                    <View style={[styles.letterCircle, { backgroundColor: letterBg }]}>
                      <Text style={styles.letterText}>{CHOICE_LETTERS[idx]}</Text>
                    </View>
                    <Text style={[styles.answerText, { color: textColor }]} numberOfLines={1}>
                      {choice}
                    </Text>
                    {revealed && isCorrectAnswer && (
                      <Text style={styles.checkMark}>✓</Text>
                    )}
                    {revealed && isSelected && !isCorrectAnswer && (
                      <Text style={styles.crossMark}>✗</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Next button */}
            {revealed && (
              <Animated.View style={[styles.nextContainer, { opacity: revealAnim }]}>
                <TouchableOpacity style={styles.nextButton} onPress={loadRandomPokemon}>
                  <Text style={styles.nextButtonText}>NEXT ROUND</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d1a',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 40) + 12 : 56,
    paddingBottom: 8,
  },
  scorePill: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0d0d1a',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  titleBanner: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#6a6a9a',
    letterSpacing: 6,
  },
  titleTextAccent: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: 3,
    textShadowColor: 'rgba(255, 215, 0, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageArea: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  spotlightCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#252550',
    borderWidth: 3,
    borderColor: '#3a3a6e',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6a6aff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
  },
  pokemonImage: {
    width: 170,
    height: 170,
    resizeMode: 'contain',
  },
  silhouette: {
    tintColor: '#0a0a1a',
  },
  questionMark: {
    position: 'absolute',
    fontSize: 80,
    fontWeight: '900',
    color: 'rgba(255, 215, 0, 0.08)',
  },
  revealBanner: {
    alignItems: 'center',
    marginTop: 12,
  },
  itsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6a6a9a',
    letterSpacing: 3,
  },
  revealName: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2,
  },
  revealId: {
    fontSize: 14,
    color: '#6a6a9a',
    marginTop: 2,
  },
  answersArea: {
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 8,
  },
  answerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 2,
  },
  letterCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  letterText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
  answerText: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
  },
  checkMark: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2ecc71',
    marginLeft: 8,
  },
  crossMark: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E63946',
    marginLeft: 8,
  },
  nextContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  nextButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 30,
  },
  nextButtonText: {
    color: '#0d0d1a',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
});
