import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import type { PlayStackParamList, Player, TeamAssignment, AssignmentMode } from '../../types';
import { getPlayers } from '../../database/queries';
import { getTeamColor } from '../../utils/randomizer';

type NavigationProp = NativeStackNavigationProp<PlayStackParamList, 'Randomizer'>;
type RouteProp = NativeStackScreenProps<PlayStackParamList, 'Randomizer'>['route'];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const WHEEL_SIZE = SCREEN_WIDTH * 0.85;

export default function RandomizerScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const { selectedPlayerIds, gameId, teamCount, teamNames, assignmentMode, removeAfterPick } = route.params;

  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [remainingPlayers, setRemainingPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<TeamAssignment[]>([]);
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const rotation = useRef(new Animated.Value(0)).current;
  const currentRotation = useRef(0);

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = async () => {
    try {
      const players = await getPlayers(true);
      const selected = players.filter((p) => selectedPlayerIds.includes(p.id));

      // Shuffle the initial order
      const shuffled = [...selected].sort(() => Math.random() - 0.5);

      setAllPlayers(shuffled);
      setRemainingPlayers(shuffled);

      // Initialize empty teams
      const emptyTeams: TeamAssignment[] = teamNames.map((name) => ({
        name,
        playerIds: [],
        playerNames: [],
      }));
      setTeams(emptyTeams);
    } catch (error) {
      console.error('Failed to load players:', error);
    }
  };

  const getNextTeamIndex = useCallback((currentIdx: number, currentTeams: TeamAssignment[]): number => {
    if (assignmentMode === 'round-robin') {
      // Rotate through teams
      return (currentIdx + 1) % teamCount;
    } else {
      // Fill-first: stay on current team until full
      const playersPerTeam = Math.ceil(selectedPlayerIds.length / teamCount);
      if (currentTeams[currentIdx].playerIds.length >= playersPerTeam) {
        return (currentIdx + 1) % teamCount;
      }
      return currentIdx;
    }
  }, [assignmentMode, teamCount, selectedPlayerIds.length]);

  const spinWheel = () => {
    if (isSpinning || remainingPlayers.length === 0) return;

    setIsSpinning(true);
    setSelectedPlayer(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Pick a random player
    const randomIndex = Math.floor(Math.random() * remainingPlayers.length);
    const pickedPlayer = remainingPlayers[randomIndex];

    // Calculate rotation to land on this player
    const segmentAngle = 360 / remainingPlayers.length;
    const targetSegment = randomIndex;

    // Add 5-8 full rotations plus the target angle
    const fullSpins = 5 + Math.random() * 3;
    const targetAngle = (fullSpins * 360) + (360 - (targetSegment * segmentAngle + segmentAngle / 2));

    const newRotation = currentRotation.current + targetAngle;

    Animated.timing(rotation, {
      toValue: newRotation,
      duration: 4000,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      useNativeDriver: true,
    }).start(() => {
      currentRotation.current = newRotation;
      onSpinComplete(pickedPlayer);
    });
  };

  const onSpinComplete = (pickedPlayer: Player) => {
    setIsSpinning(false);
    setSelectedPlayer(pickedPlayer);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Add player to current team
    setTeams((prevTeams) => {
      const newTeams = [...prevTeams];
      newTeams[currentTeamIndex] = {
        ...newTeams[currentTeamIndex],
        playerIds: [...newTeams[currentTeamIndex].playerIds, pickedPlayer.id],
        playerNames: [...newTeams[currentTeamIndex].playerNames, pickedPlayer.name],
      };

      // Calculate next team index
      const nextIdx = getNextTeamIndex(currentTeamIndex, newTeams);
      setCurrentTeamIndex(nextIdx);

      return newTeams;
    });

    // Remove player from wheel if setting is enabled
    if (removeAfterPick) {
      setRemainingPlayers((prev) => prev.filter((p) => p.id !== pickedPlayer.id));
    }
  };

  const handleContinue = () => {
    if (remainingPlayers.length === 0 || (!removeAfterPick && teams.every(t => t.playerIds.length > 0))) {
      // Check if all players are assigned
      const totalAssigned = teams.reduce((sum, t) => sum + t.playerIds.length, 0);
      if (totalAssigned >= allPlayers.length) {
        setIsComplete(true);
        setTimeout(() => {
          navigation.replace('TeamReveal', { teams, gameId });
        }, 500);
      }
    }
  };

  // Check if game is complete
  useEffect(() => {
    const totalAssigned = teams.reduce((sum, t) => sum + t.playerIds.length, 0);
    if (totalAssigned >= allPlayers.length && allPlayers.length > 0 && !isSpinning) {
      setIsComplete(true);
    }
  }, [teams, allPlayers.length, isSpinning]);

  const segmentAngle = remainingPlayers.length > 0 ? 360 / remainingPlayers.length : 360;

  const spin = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Header showing current team */}
      <View style={styles.header}>
        <Text style={styles.pickingFor}>Picking for</Text>
        <View style={styles.teamBadge}>
          <View style={[styles.teamDot, { backgroundColor: getTeamColor(currentTeamIndex) }]} />
          <Text style={styles.teamName}>{teamNames[currentTeamIndex]}</Text>
        </View>
      </View>

      {/* Selected player announcement */}
      {selectedPlayer && !isSpinning && (
        <View style={styles.selectedAnnouncement}>
          <Text style={styles.selectedName}>{selectedPlayer.name}</Text>
          <Text style={styles.selectedTeam}>
            joins {teamNames[currentTeamIndex === 0 ? teamCount - 1 : currentTeamIndex - 1] || teamNames[currentTeamIndex]}!
          </Text>
        </View>
      )}

      {/* Wheel */}
      <View style={styles.wheelContainer}>
        {/* Pointer at top */}
        <View style={styles.pointer}>
          <View style={styles.pointerArrow} />
        </View>

        <Animated.View
          style={[
            styles.wheel,
            { transform: [{ rotate: spin }] },
          ]}
        >
          {remainingPlayers.map((player, index) => {
            const angle = index * segmentAngle;
            const isSelected = selectedPlayer?.id === player.id;

            return (
              <View
                key={player.id}
                style={[
                  styles.segment,
                  {
                    transform: [
                      { rotate: `${angle}deg` },
                      { translateY: -WHEEL_SIZE / 2 + 60 },
                    ],
                  },
                ]}
              >
                <View
                  style={[
                    styles.segmentContent,
                    isSelected && styles.segmentContentSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      isSelected && styles.segmentTextSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {player.name}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Segment divider lines */}
          {remainingPlayers.map((_, index) => (
            <View
              key={`line-${index}`}
              style={[
                styles.segmentLine,
                {
                  transform: [
                    { rotate: `${index * segmentAngle}deg` },
                  ],
                },
              ]}
            />
          ))}
        </Animated.View>

        {/* Center */}
        <View style={styles.centerCircle}>
          <Text style={styles.centerText}>
            {remainingPlayers.length}
          </Text>
          <Text style={styles.centerLabel}>left</Text>
        </View>
      </View>

      {/* Team progress */}
      <View style={styles.teamsProgress}>
        {teams.map((team, index) => (
          <View key={team.name} style={styles.teamProgress}>
            <View style={[styles.teamProgressDot, { backgroundColor: getTeamColor(index) }]} />
            <Text style={styles.teamProgressName}>{team.name}</Text>
            <Text style={styles.teamProgressCount}>{team.playerIds.length}</Text>
          </View>
        ))}
      </View>

      {/* Action button */}
      {isComplete ? (
        <TouchableOpacity
          style={styles.completeButton}
          onPress={() => navigation.replace('TeamReveal', { teams, gameId })}
        >
          <Text style={styles.completeButtonText}>See Teams!</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.spinButton, isSpinning && styles.spinButtonDisabled]}
          onPress={spinWheel}
          disabled={isSpinning}
        >
          <Text style={styles.spinButtonText}>
            {isSpinning ? 'Spinning...' : 'Spin!'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    paddingTop: Spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  pickingFor: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  teamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.xs,
    gap: Spacing.sm,
  },
  teamDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  teamName: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  selectedAnnouncement: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  selectedName: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.accent,
  },
  selectedTeam: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  wheelContainer: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.md,
  },
  pointer: {
    position: 'absolute',
    top: -10,
    zIndex: 10,
    alignItems: 'center',
  },
  pointerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderTopWidth: 25,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.accent,
  },
  wheel: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: WHEEL_SIZE / 2,
    backgroundColor: Colors.surface,
    borderWidth: 4,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segment: {
    position: 'absolute',
    alignItems: 'center',
    width: 100,
  },
  segmentContent: {
    backgroundColor: Colors.surfaceLight,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  segmentContentSelected: {
    backgroundColor: Colors.accent,
  },
  segmentText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  segmentTextSelected: {
    color: Colors.background,
    fontWeight: 'bold',
  },
  segmentLine: {
    position: 'absolute',
    width: 2,
    height: WHEEL_SIZE / 2,
    backgroundColor: Colors.border,
    top: 0,
    left: WHEEL_SIZE / 2 - 1,
    transformOrigin: 'bottom',
  },
  centerCircle: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  centerLabel: {
    fontSize: FontSizes.xs,
    color: Colors.text,
    opacity: 0.8,
  },
  teamsProgress: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginVertical: Spacing.lg,
  },
  teamProgress: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  teamProgressDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  teamProgressName: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  teamProgressCount: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  spinButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl * 2,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
  },
  spinButtonDisabled: {
    backgroundColor: Colors.surfaceLight,
  },
  spinButtonText: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  completeButton: {
    backgroundColor: Colors.success,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl * 2,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
  },
  completeButtonText: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
});
