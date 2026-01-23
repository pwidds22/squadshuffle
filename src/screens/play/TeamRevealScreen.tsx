import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import type { PlayStackParamList, Game } from '../../types';
import { createSession, getGames } from '../../database/queries';
import { getTeamColor } from '../../utils/randomizer';

type NavigationProp = NativeStackNavigationProp<PlayStackParamList, 'TeamReveal'>;
type RouteProp = NativeStackScreenProps<PlayStackParamList, 'TeamReveal'>['route'];

export default function TeamRevealScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const { teams, gameId } = route.params;

  const [game, setGame] = useState<Game | null>(null);
  const [isLocking, setIsLocking] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const teamAnims = useRef(teams.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    loadGame();
    // Haptic on reveal
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Fade in header
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Staggered team card animations
    Animated.stagger(
      150,
      teamAnims.map((anim) =>
        Animated.spring(anim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        })
      )
    ).start();
  }, []);

  const loadGame = async () => {
    try {
      const games = await getGames();
      const foundGame = games.find((g) => g.id === gameId);
      setGame(foundGame || null);
    } catch (error) {
      console.error('Failed to load game:', error);
    }
  };

  const handleShuffleAgain = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const handleLockTeams = async () => {
    setIsLocking(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Create session in database
      const session = await createSession(
        gameId,
        teams.map((t) => ({
          name: t.name,
          playerIds: t.playerIds,
        }))
      );

      // Navigate to active game screen for live score tracking
      navigation.replace('ActiveGame', { sessionId: session.id });
    } catch (error) {
      console.error('Failed to create session:', error);
      Alert.alert('Error', 'Failed to create game session');
      setIsLocking(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {game && (
          <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
            <Ionicons
              name={game.iconName as keyof typeof Ionicons.glyphMap}
              size={28}
              color={Colors.primary}
            />
            <Text style={styles.gameName}>{game.name}</Text>
          </Animated.View>
        )}

        <Animated.Text style={[styles.title, { opacity: fadeAnim }]}>
          Your Teams!
        </Animated.Text>

        {teams.map((team, index) => (
          <Animated.View
            key={team.name}
            style={[
              styles.teamCard,
              {
                opacity: teamAnims[index],
                transform: [
                  {
                    translateY: teamAnims[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.teamHeader}>
              <View
                style={[
                  styles.teamColorBar,
                  { backgroundColor: getTeamColor(index) },
                ]}
              />
              <Text style={styles.teamName}>{team.name}</Text>
              <Text style={styles.playerCount}>
                {team.playerNames.length} player
                {team.playerNames.length !== 1 ? 's' : ''}
              </Text>
            </View>

            <View style={styles.playersContainer}>
              {team.playerNames.map((name, playerIndex) => (
                <View key={playerIndex} style={styles.playerRow}>
                  <View
                    style={[
                      styles.playerAvatar,
                      { backgroundColor: getTeamColor(index) },
                    ]}
                  >
                    <Text style={styles.playerInitial}>
                      {name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.playerName}>{name}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        ))}
      </ScrollView>

      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.shuffleAgainButton}
          onPress={handleShuffleAgain}
          disabled={isLocking}
        >
          <Ionicons name="shuffle" size={20} color={Colors.primary} />
          <Text style={styles.shuffleAgainText}>Shuffle Again</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.lockButton, isLocking && styles.lockButtonDisabled]}
          onPress={handleLockTeams}
          disabled={isLocking}
        >
          <Ionicons name="lock-closed" size={20} color={Colors.text} />
          <Text style={styles.lockButtonText}>
            {isLocking ? 'Saving...' : 'Lock Teams'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  gameName: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  teamCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    paddingLeft: 0,
  },
  teamColorBar: {
    width: 4,
    height: '100%',
    marginRight: Spacing.md,
  },
  teamName: {
    flex: 1,
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  playerCount: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  playersContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  playerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerInitial: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  playerName: {
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  shuffleAgainButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.primary,
    gap: Spacing.xs,
  },
  shuffleAgainText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.primary,
  },
  lockButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  lockButtonDisabled: {
    backgroundColor: Colors.surfaceLight,
  },
  lockButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
});
