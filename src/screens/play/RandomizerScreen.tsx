import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import type { PlayStackParamList, Player, TeamAssignment } from '../../types';
import { getPlayers } from '../../database/queries';
import { getTeamColor } from '../../utils/randomizer';
import { SpinWheel, SpinWheelRef } from '../../components/SpinWheel';

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
  const wheelRef = useRef<SpinWheelRef>(null);
  const pendingPickRef = useRef<{ player: Player; index: number } | null>(null);

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

    // Pick a random player
    const randomIndex = Math.floor(Math.random() * remainingPlayers.length);
    const pickedPlayer = remainingPlayers[randomIndex];

    // Store the pending pick in a ref so the callback always reads current value
    pendingPickRef.current = { player: pickedPlayer, index: randomIndex };

    // Spin the wheel to land on this player
    wheelRef.current?.spinToIndex(randomIndex);
  };

  const handleSpinStart = () => {
    setIsSpinning(true);
    setSelectedPlayer(null);
  };

  const handleSpinEnd = (winner: string, index: number) => {
    setIsSpinning(false);

    const pendingPick = pendingPickRef.current;
    if (pendingPick) {
      const pickedPlayer = pendingPick.player;
      setSelectedPlayer(pickedPlayer);

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
        // Reset wheel rotation for next spin with new segments
        wheelRef.current?.reset();
      }

      pendingPickRef.current = null;
    }
  };

  // Auto-assign last player (no need to spin for just one person)
  useEffect(() => {
    if (remainingPlayers.length === 1 && !isSpinning && !isComplete && teams.length > 0) {
      const timer = setTimeout(() => {
        const lastPlayer = remainingPlayers[0];
        setSelectedPlayer(lastPlayer);

        // Add player to current team
        setTeams((prevTeams) => {
          const newTeams = [...prevTeams];
          newTeams[currentTeamIndex] = {
            ...newTeams[currentTeamIndex],
            playerIds: [...newTeams[currentTeamIndex].playerIds, lastPlayer.id],
            playerNames: [...newTeams[currentTeamIndex].playerNames, lastPlayer.name],
          };
          return newTeams;
        });

        // Remove from remaining
        setRemainingPlayers([]);
      }, 500); // Brief delay so user sees what's happening

      return () => clearTimeout(timer);
    }
  }, [remainingPlayers.length, isSpinning, isComplete, teams.length, currentTeamIndex]);

  // Check if game is complete
  useEffect(() => {
    const totalAssigned = teams.reduce((sum, t) => sum + t.playerIds.length, 0);
    if (totalAssigned >= allPlayers.length && allPlayers.length > 0 && !isSpinning) {
      setIsComplete(true);
    }
  }, [teams, allPlayers.length, isSpinning]);

  // Get the team the last player joined (for announcement)
  const getLastTeamName = () => {
    if (currentTeamIndex === 0) {
      return teamNames[teamCount - 1];
    }
    return teamNames[currentTeamIndex - 1];
  };

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
          <Text style={styles.selectedTeam}>joins {getLastTeamName()}!</Text>
        </View>
      )}

      {/* Wheel */}
      <View style={styles.wheelContainer}>
        {remainingPlayers.length > 0 ? (
          <SpinWheel
            ref={wheelRef}
            segments={remainingPlayers.map((p) => p.name)}
            size={WHEEL_SIZE}
            onSpinStart={handleSpinStart}
            onSpinEnd={handleSpinEnd}
          />
        ) : (
          <View style={styles.emptyWheel}>
            <Text style={styles.emptyWheelText}>All players assigned!</Text>
          </View>
        )}
      </View>

      {/* Remaining count */}
      <Text style={styles.remainingText}>
        {remainingPlayers.length} player{remainingPlayers.length !== 1 ? 's' : ''} remaining
      </Text>

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
          disabled={isSpinning || remainingPlayers.length === 0}
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
  emptyWheel: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: WHEEL_SIZE / 2,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: Colors.primary,
  },
  emptyWheelText: {
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  remainingText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
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
