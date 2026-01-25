import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import type { PlayStackParamList, Team, Game, Player } from '../../types';
import {
  getTeamsForSession,
  updateTeamScore,
  endSession,
  getPlayers,
  getGameById,
} from '../../database/queries';
import { getTeamColor } from '../../utils/randomizer';

type NavigationProp = NativeStackNavigationProp<PlayStackParamList, 'ActiveGame'>;
type RouteProp = NativeStackScreenProps<PlayStackParamList, 'ActiveGame'>['route'];

// Extended team type with player names
interface TeamWithNames extends Team {
  playerNames: string[];
}

export default function ActiveGameScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const { sessionId, gameId, selectedPlayerIds } = route.params;

  const [teams, setTeams] = useState<TeamWithNames[]>([]);
  const [game, setGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEndModal, setShowEndModal] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
  const [showPlayAgainModal, setShowPlayAgainModal] = useState(false);

  useEffect(() => {
    loadGameData();
  }, []);

  const loadGameData = async () => {
    try {
      const [teamsData, allPlayers, gameData] = await Promise.all([
        getTeamsForSession(sessionId),
        getPlayers(false), // Get all players including inactive
        gameId ? getGameById(gameId) : null,
      ]);

      // Create a map for quick lookup
      const playerMap = new Map(allPlayers.map((p) => [p.id, p.name]));

      // Add player names to teams
      const teamsWithNames: TeamWithNames[] = teamsData.map((team) => ({
        ...team,
        playerNames: team.playerIds.map((id) => playerMap.get(id) || 'Unknown'),
      }));

      setTeams(teamsWithNames);
      setGame(gameData);
    } catch (error) {
      console.error('Failed to load game data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const adjustScore = async (teamId: string, delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const team = teams.find((t) => t.id === teamId);
    if (!team) return;

    const newScore = Math.max(0, (team.score || 0) + delta);

    // Update local state immediately for responsiveness
    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, score: newScore } : t))
    );

    // Update database
    try {
      await updateTeamScore(teamId, newScore);
    } catch (error) {
      console.error('Failed to update score:', error);
    }
  };

  const handleEndGame = () => {
    // Auto-select winner based on scores
    const autoWinner = getWinnerByScore();
    setSelectedWinner(autoWinner);
    setShowEndModal(true);
  };

  const confirmEndGame = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      await endSession(sessionId, selectedWinner, null);

      setShowEndModal(false);

      // Show play again options
      setShowPlayAgainModal(true);
    } catch (error) {
      console.error('Failed to end session:', error);
      Alert.alert('Error', 'Failed to save game results');
    }
  };

  const handlePlayAgainSameTeams = () => {
    setShowPlayAgainModal(false);
    // Navigate to team config with same setup to create new session
    if (gameId && selectedPlayerIds) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            { name: 'PlayHome' },
            {
              name: 'TeamConfig',
              params: { selectedPlayerIds, gameId, reuseTeams: teams.map(t => ({ name: t.name, playerIds: t.playerIds })) },
            },
          ],
        })
      );
    }
  };

  const handlePlayAgainNewTeams = () => {
    setShowPlayAgainModal(false);
    // Navigate to randomizer with same players
    if (gameId && selectedPlayerIds) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            { name: 'PlayHome' },
            { name: 'PlayerSelection' },
            { name: 'GameSelection', params: { selectedPlayerIds } },
            { name: 'TeamConfig', params: { selectedPlayerIds, gameId } },
          ],
        })
      );
    }
  };

  const handleDone = () => {
    setShowPlayAgainModal(false);
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'PlayHome' }],
      })
    );
  };

  const getWinnerByScore = (): string | null => {
    if (teams.length === 0) return null;

    const lowerWins = game?.lowerScoreWins ?? false;
    const sorted = [...teams].sort((a, b) => {
      const scoreA = a.score ?? 0;
      const scoreB = b.score ?? 0;
      return lowerWins ? scoreA - scoreB : scoreB - scoreA;
    });

    // Check for tie
    if (sorted.length > 1 && (sorted[0].score ?? 0) === (sorted[1].score ?? 0)) {
      return null; // Tie
    }

    return sorted[0].id;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Live Score</Text>

        {teams.map((team, index) => (
          <View key={team.id} style={styles.teamCard}>
            <View style={styles.teamHeader}>
              <View
                style={[styles.teamColorBar, { backgroundColor: getTeamColor(index) }]}
              />
              <Text style={styles.teamName}>{team.name}</Text>
            </View>

            <View style={styles.scoreSection}>
              <TouchableOpacity
                style={styles.scoreButton}
                onPress={() => adjustScore(team.id, -1)}
              >
                <Ionicons name="remove" size={32} color={Colors.text} />
              </TouchableOpacity>

              <View style={styles.scoreDisplay}>
                <Text style={styles.scoreValue}>{team.score || 0}</Text>
              </View>

              <TouchableOpacity
                style={styles.scoreButton}
                onPress={() => adjustScore(team.id, 1)}
              >
                <Ionicons name="add" size={32} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* Quick add buttons */}
            <View style={styles.quickButtons}>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => adjustScore(team.id, 5)}
              >
                <Text style={styles.quickButtonText}>+5</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => adjustScore(team.id, 10)}
              >
                <Text style={styles.quickButtonText}>+10</Text>
              </TouchableOpacity>
            </View>

            {/* Player names */}
            <View style={styles.playerList}>
              {team.playerNames.map((name, playerIndex) => (
                <View key={playerIndex} style={styles.playerChip}>
                  <Text style={styles.playerChipText}>{name}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.endButton} onPress={handleEndGame}>
          <Ionicons name="flag" size={20} color={Colors.text} />
          <Text style={styles.endButtonText}>End Game</Text>
        </TouchableOpacity>
      </View>

      {/* End Game Modal */}
      <Modal
        visible={showEndModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEndModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>End Game</Text>
            <Text style={styles.modalSubtitle}>Select the winner</Text>

            {teams.map((team, index) => (
              <TouchableOpacity
                key={team.id}
                style={[
                  styles.winnerOption,
                  selectedWinner === team.id && styles.winnerOptionSelected,
                ]}
                onPress={() => setSelectedWinner(team.id)}
              >
                <View style={styles.winnerInfo}>
                  <View
                    style={[styles.winnerDot, { backgroundColor: getTeamColor(index) }]}
                  />
                  <Text style={styles.winnerName}>{team.name}</Text>
                  <Text style={styles.winnerScore}>{team.score || 0} pts</Text>
                </View>
                {selectedWinner === team.id && (
                  <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[
                styles.winnerOption,
                selectedWinner === null && styles.winnerOptionSelected,
              ]}
              onPress={() => setSelectedWinner(null)}
            >
              <View style={styles.winnerInfo}>
                <Ionicons name="remove-circle-outline" size={20} color={Colors.textMuted} />
                <Text style={styles.winnerName}>No Winner / Tie</Text>
              </View>
              {selectedWinner === null && (
                <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
              )}
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowEndModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmEndGame}
              >
                <Text style={styles.confirmButtonText}>Save & End</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Play Again Modal */}
      <Modal
        visible={showPlayAgainModal}
        animationType="fade"
        transparent={true}
        onRequestClose={handleDone}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="trophy" size={48} color={Colors.accent} style={styles.trophyIcon} />
            <Text style={styles.modalTitle}>Game Complete!</Text>
            <Text style={styles.modalSubtitle}>
              {selectedWinner
                ? `${teams.find(t => t.id === selectedWinner)?.name} wins!`
                : 'It\'s a tie!'}
            </Text>

            <TouchableOpacity
              style={styles.playAgainOption}
              onPress={handlePlayAgainSameTeams}
            >
              <Ionicons name="refresh" size={24} color={Colors.primary} />
              <View style={styles.playAgainText}>
                <Text style={styles.playAgainTitle}>Play Again - Same Teams</Text>
                <Text style={styles.playAgainHint}>Quick rematch with current teams</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.playAgainOption}
              onPress={handlePlayAgainNewTeams}
            >
              <Ionicons name="shuffle" size={24} color={Colors.primary} />
              <View style={styles.playAgainText}>
                <Text style={styles.playAgainTitle}>New Random Teams</Text>
                <Text style={styles.playAgainHint}>Re-shuffle with same players</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.doneButton}
              onPress={handleDone}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  content: {
    padding: Spacing.lg,
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
    marginBottom: Spacing.lg,
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
    height: 40,
    marginRight: Spacing.md,
  },
  teamName: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.lg,
  },
  scoreButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreDisplay: {
    minWidth: 100,
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: FontSizes.hero,
    fontWeight: 'bold',
    color: Colors.text,
  },
  quickButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  quickButton: {
    backgroundColor: Colors.surfaceLight,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  quickButtonText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  playerList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  playerChip: {
    backgroundColor: Colors.surfaceLight,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  playerChipText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  footer: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  endButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  endButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  winnerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  winnerOptionSelected: {
    borderColor: Colors.primary,
  },
  winnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  winnerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  winnerName: {
    fontSize: FontSizes.md,
    color: Colors.text,
    fontWeight: '500',
  },
  winnerScore: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  // Play Again Modal styles
  trophyIcon: {
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  playAgainOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  playAgainText: {
    flex: 1,
  },
  playAgainTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  playAgainHint: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  doneButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
