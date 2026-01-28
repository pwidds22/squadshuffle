import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, FontSizes, BorderRadius } from '../constants/theme';
import { getPlayers, getGames, createSession, updateTeamScore, endSession, getGameById, addGame } from '../database/queries';
import { getTeamColor } from '../utils/randomizer';
import type { Player, Game } from '../types';
import type { HistoryStackParamList } from '../navigation/HistoryStackNavigator';

type NavigationProp = NativeStackNavigationProp<HistoryStackParamList, 'ManualGameEntry'>;

// Available icons for new games
const GAME_ICONS = [
  'game-controller', 'basketball', 'football', 'tennisball', 'golf',
  'dice', 'puzzle', 'trophy', 'flag', 'ribbon',
  'star', 'heart', 'diamond', 'flash', 'flame',
];

export default function ManualGameEntryScreen() {
  const navigation = useNavigation<NavigationProp>();

  // Data
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [teamCount, setTeamCount] = useState(2);
  const [teamNames, setTeamNames] = useState<string[]>(['Team 1', 'Team 2']);
  const [playerAssignments, setPlayerAssignments] = useState<Record<string, number>>({}); // playerId -> teamIndex
  const [teamScores, setTeamScores] = useState<(number | null)[]>([null, null]);

  // Modal states
  const [showNewGameModal, setShowNewGameModal] = useState(false);
  const [newGameName, setNewGameName] = useState('');
  const [newGameIcon, setNewGameIcon] = useState('game-controller');
  const [showTeamCountModal, setShowTeamCountModal] = useState(false);
  const [showTeamSelectModal, setShowTeamSelectModal] = useState<string | null>(null); // playerId or null

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [playersData, gamesData] = await Promise.all([
        getPlayers(true),
        getGames(),
      ]);
      setPlayers(playersData);
      setGames(gamesData);
      if (gamesData.length > 0) {
        setSelectedGameId(gamesData[0].id);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  // Create new game
  const handleCreateGame = async () => {
    if (!newGameName.trim()) {
      Alert.alert('Error', 'Please enter a game name');
      return;
    }
    try {
      const newGame = await addGame({
        name: newGameName.trim(),
        iconName: newGameIcon,
        lowerScoreWins: false,
      });
      setGames((prev) => [...prev, newGame]);
      setSelectedGameId(newGame.id);
      setNewGameName('');
      setNewGameIcon('game-controller');
      setShowNewGameModal(false);
    } catch (error) {
      console.error('Failed to create game:', error);
      Alert.alert('Error', 'Failed to create game');
    }
  };

  // Get max team count based on selected players
  const maxTeamCount = Math.max(2, selectedPlayerIds.length);

  // Update team count
  const handleTeamCountChange = (count: number) => {
    setTeamCount(count);
    // Extend or trim team names
    const newNames = [...teamNames];
    while (newNames.length < count) {
      newNames.push(`Team ${newNames.length + 1}`);
    }
    setTeamNames(newNames.slice(0, count));
    // Extend or trim scores
    const newScores = [...teamScores];
    while (newScores.length < count) {
      newScores.push(null);
    }
    setTeamScores(newScores.slice(0, count));
    // Reset any assignments to teams that no longer exist
    const newAssignments: Record<string, number> = {};
    Object.entries(playerAssignments).forEach(([playerId, teamIndex]) => {
      if (teamIndex < count) {
        newAssignments[playerId] = teamIndex;
      }
    });
    setPlayerAssignments(newAssignments);
    setShowTeamCountModal(false);
  };

  // Toggle player selection
  const togglePlayer = (playerId: string) => {
    setSelectedPlayerIds((prev) => {
      if (prev.includes(playerId)) {
        // Remove from selected and clear assignment
        const newAssignments = { ...playerAssignments };
        delete newAssignments[playerId];
        setPlayerAssignments(newAssignments);
        return prev.filter((id) => id !== playerId);
      }
      return [...prev, playerId];
    });
  };

  // Assign player to team
  const assignPlayerToTeam = (playerId: string, teamIndex: number) => {
    setPlayerAssignments((prev) => ({
      ...prev,
      [playerId]: teamIndex,
    }));
    setShowTeamSelectModal(null);
  };

  // Update team name
  const updateTeamName = (index: number, name: string) => {
    const newNames = [...teamNames];
    newNames[index] = name;
    setTeamNames(newNames);
  };

  // Update team score
  const updateScore = (index: number, scoreStr: string) => {
    const newScores = [...teamScores];
    if (scoreStr === '') {
      newScores[index] = null;
    } else {
      const score = parseInt(scoreStr, 10);
      newScores[index] = isNaN(score) ? null : score;
    }
    setTeamScores(newScores);
  };

  // Validate form
  const validate = (): string | null => {
    if (!selectedGameId) {
      return 'Please select a game';
    }
    if (selectedPlayerIds.length < 2) {
      return 'Please select at least 2 players';
    }
    // Check all selected players are assigned
    const unassigned = selectedPlayerIds.filter((id) => playerAssignments[id] === undefined);
    if (unassigned.length > 0) {
      return 'Please assign all players to teams';
    }
    // Check each team has at least one player
    for (let i = 0; i < teamCount; i++) {
      const teamPlayers = selectedPlayerIds.filter((id) => playerAssignments[id] === i);
      if (teamPlayers.length === 0) {
        return `${teamNames[i] || `Team ${i + 1}`} has no players`;
      }
    }
    return null;
  };

  // Save the game
  const handleSave = async () => {
    const error = validate();
    if (error) {
      Alert.alert('Validation Error', error);
      return;
    }

    setIsSaving(true);
    try {
      // Build teams array
      const teams = [];
      for (let i = 0; i < teamCount; i++) {
        const teamPlayerIds = selectedPlayerIds.filter((id) => playerAssignments[id] === i);
        teams.push({
          name: teamNames[i] || `Team ${i + 1}`,
          playerIds: teamPlayerIds,
        });
      }

      // Create session
      const session = await createSession(selectedGameId!, teams);

      // Get teams from session to get their IDs
      const { getTeamsForSession } = await import('../database/queries');
      const savedTeams = await getTeamsForSession(session.id);

      // Update scores
      for (let i = 0; i < savedTeams.length; i++) {
        const score = teamScores[i];
        if (score !== null) {
          await updateTeamScore(savedTeams[i].id, score);
        }
      }

      // End session (calculates winner and placements)
      await endSession(session.id, null); // null = auto-detect winner from scores

      Alert.alert('Success', 'Game saved successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Failed to save game:', error);
      Alert.alert('Error', 'Failed to save game');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const selectedGame = games.find((g) => g.id === selectedGameId);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Game Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Type</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.gamesRow}
          >
            {/* Create New Game Card */}
            <TouchableOpacity
              style={styles.gameCard}
              onPress={() => setShowNewGameModal(true)}
            >
              <Ionicons name="add" size={28} color={Colors.primary} />
              <Text style={[styles.gameCardText, { color: Colors.primary }]}>New Game</Text>
            </TouchableOpacity>

            {games.map((game) => (
              <TouchableOpacity
                key={game.id}
                style={[
                  styles.gameCard,
                  selectedGameId === game.id && styles.gameCardSelected,
                ]}
                onPress={() => setSelectedGameId(game.id)}
              >
                <Ionicons
                  name={game.iconName as keyof typeof Ionicons.glyphMap}
                  size={28}
                  color={selectedGameId === game.id ? Colors.primary : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.gameCardText,
                    selectedGameId === game.id && styles.gameCardTextSelected,
                  ]}
                  numberOfLines={1}
                >
                  {game.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Player Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Players</Text>
            <Text style={styles.sectionSubtitle}>{selectedPlayerIds.length} selected</Text>
          </View>
          {players.length === 0 ? (
            <Text style={styles.emptyText}>No players yet. Add some in the Players tab.</Text>
          ) : (
            <View style={styles.playersList}>
              {players.map((player) => {
                const isSelected = selectedPlayerIds.includes(player.id);
                return (
                  <TouchableOpacity
                    key={player.id}
                    style={[styles.playerRow, isSelected && styles.playerRowSelected]}
                    onPress={() => togglePlayer(player.id)}
                  >
                    <View style={styles.playerInfo}>
                      <Ionicons
                        name={isSelected ? 'checkbox' : 'square-outline'}
                        size={22}
                        color={isSelected ? Colors.primary : Colors.textMuted}
                      />
                      <Text style={styles.playerName}>{player.name}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Number of Teams */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Number of Teams</Text>
          <TouchableOpacity
            style={styles.teamCountSelector}
            onPress={() => setShowTeamCountModal(true)}
          >
            <Text style={styles.teamCountValue}>{teamCount} Teams</Text>
            <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
          {selectedPlayerIds.length > 0 && selectedPlayerIds.length < teamCount && (
            <Text style={styles.warningText}>
              You have fewer players ({selectedPlayerIds.length}) than teams ({teamCount})
            </Text>
          )}
        </View>

        {/* Team Names */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Team Names</Text>
          <Text style={styles.sectionHint}>Customize the name for each team (optional)</Text>
          <View style={styles.teamNamesContainer}>
            {teamNames.slice(0, teamCount).map((name, index) => (
              <View key={index} style={styles.teamNameRow}>
                <View style={[styles.teamColorDot, { backgroundColor: getTeamColor(index) }]} />
                <TextInput
                  style={styles.teamNameInput}
                  value={name}
                  onChangeText={(text) => updateTeamName(index, text)}
                  placeholder={`Team ${index + 1}`}
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Player Assignment */}
        {selectedPlayerIds.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assign Players to Teams</Text>
            <Text style={styles.sectionHint}>Tap to select which team each player is on</Text>
            <View style={styles.assignmentList}>
              {selectedPlayerIds.map((playerId) => {
                const player = players.find((p) => p.id === playerId);
                const assignedTeamIndex = playerAssignments[playerId];
                const assignedTeamName = assignedTeamIndex !== undefined
                  ? teamNames[assignedTeamIndex] || `Team ${assignedTeamIndex + 1}`
                  : null;
                const assignedColor = assignedTeamIndex !== undefined
                  ? getTeamColor(assignedTeamIndex)
                  : null;

                return (
                  <TouchableOpacity
                    key={playerId}
                    style={styles.assignmentRow}
                    onPress={() => setShowTeamSelectModal(playerId)}
                  >
                    <Text style={styles.assignmentPlayerName}>{player?.name}</Text>
                    <View style={styles.teamSelector}>
                      {assignedColor && (
                        <View style={[styles.teamColorDotSmall, { backgroundColor: assignedColor }]} />
                      )}
                      <Text style={[
                        styles.teamSelectorText,
                        !assignedTeamName && styles.teamSelectorPlaceholder
                      ]}>
                        {assignedTeamName || 'Select team'}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Scores */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Scores</Text>
            <Text style={styles.sectionSubtitle}>
              {selectedGame?.lowerScoreWins ? 'Lower wins' : 'Higher wins'}
            </Text>
          </View>
          <View style={styles.scoresContainer}>
            {teamNames.slice(0, teamCount).map((name, index) => (
              <View key={index} style={styles.scoreRow}>
                <View style={styles.scoreTeamInfo}>
                  <View style={[styles.teamColorDot, { backgroundColor: getTeamColor(index) }]} />
                  <Text style={styles.scoreTeamName}>{name || `Team ${index + 1}`}</Text>
                </View>
                <TextInput
                  style={styles.scoreInput}
                  value={teamScores[index]?.toString() ?? ''}
                  onChangeText={(text) => updateScore(index, text)}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={Colors.text} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color={Colors.text} />
              <Text style={styles.saveButtonText}>Save Game</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* New Game Modal */}
      <Modal visible={showNewGameModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Game</Text>

            <Text style={styles.modalLabel}>Game Name</Text>
            <TextInput
              style={styles.modalInput}
              value={newGameName}
              onChangeText={setNewGameName}
              placeholder="e.g., Roblox, Trivia"
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />

            <Text style={styles.modalLabel}>Icon</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.iconGrid}>
                {GAME_ICONS.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOption,
                      newGameIcon === icon && styles.iconOptionSelected,
                    ]}
                    onPress={() => setNewGameIcon(icon)}
                  >
                    <Ionicons
                      name={icon as keyof typeof Ionicons.glyphMap}
                      size={24}
                      color={newGameIcon === icon ? Colors.primary : Colors.textMuted}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setShowNewGameModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonConfirm}
                onPress={handleCreateGame}
              >
                <Text style={styles.modalButtonConfirmText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Team Count Modal */}
      <Modal visible={showTeamCountModal} animationType="fade" transparent>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTeamCountModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Number of Teams</Text>
            <View style={styles.teamCountOptions}>
              {Array.from({ length: Math.max(maxTeamCount - 1, 1) }, (_, i) => i + 2).map((count) => (
                <TouchableOpacity
                  key={count}
                  style={[
                    styles.teamCountOption,
                    teamCount === count && styles.teamCountOptionSelected,
                  ]}
                  onPress={() => handleTeamCountChange(count)}
                >
                  <Text style={[
                    styles.teamCountOptionText,
                    teamCount === count && styles.teamCountOptionTextSelected,
                  ]}>
                    {count} Teams
                  </Text>
                  {teamCount === count && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Team Select Modal */}
      <Modal visible={showTeamSelectModal !== null} animationType="fade" transparent>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTeamSelectModal(null)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Team</Text>
            <View style={styles.teamSelectOptions}>
              {teamNames.slice(0, teamCount).map((name, index) => {
                const isSelected = showTeamSelectModal !== null && playerAssignments[showTeamSelectModal] === index;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.teamSelectOption,
                      isSelected && styles.teamSelectOptionSelected,
                    ]}
                    onPress={() => showTeamSelectModal && assignPlayerToTeam(showTeamSelectModal, index)}
                  >
                    <View style={[styles.teamColorDot, { backgroundColor: getTeamColor(index) }]} />
                    <Text style={[
                      styles.teamSelectOptionText,
                      isSelected && styles.teamSelectOptionTextSelected,
                    ]}>
                      {name || `Team ${index + 1}`}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={20} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  sectionHint: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  sectionSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  warningText: {
    fontSize: FontSizes.sm,
    color: Colors.warning,
    marginTop: Spacing.sm,
  },
  // Games
  gamesRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  gameCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gameCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  gameCardText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  gameCardTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  // Players
  playersList: {
    gap: Spacing.xs,
  },
  playerRow: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerRowSelected: {
    backgroundColor: Colors.primaryLight,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  playerName: {
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  // Team count selector
  teamCountSelector: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamCountValue: {
    fontSize: FontSizes.md,
    color: Colors.text,
    fontWeight: '500',
  },
  // Team names
  teamNamesContainer: {
    gap: Spacing.sm,
  },
  teamNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  teamColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  teamColorDotSmall: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  teamNameInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  // Assignment
  assignmentList: {
    gap: Spacing.sm,
  },
  assignmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  assignmentPlayerName: {
    fontSize: FontSizes.md,
    color: Colors.text,
    flex: 1,
  },
  teamSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  teamSelectorText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
  },
  teamSelectorPlaceholder: {
    color: Colors.textMuted,
  },
  // Scores
  scoresContainer: {
    gap: Spacing.sm,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  scoreTeamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  scoreTeamName: {
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  scoreInput: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
    minWidth: 60,
    textAlign: 'center',
  },
  // Save button
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    margin: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  bottomPadding: {
    height: Spacing.xxl,
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
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  modalInput: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  iconGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconOptionSelected: {
    borderColor: Colors.primary,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  modalButtonCancel: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontSize: FontSizes.md,
    color: Colors.textMuted,
  },
  modalButtonConfirm: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  modalButtonConfirmText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  // Team count options
  teamCountOptions: {
    gap: Spacing.xs,
  },
  teamCountOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
  },
  teamCountOptionSelected: {
    backgroundColor: Colors.primaryLight,
  },
  teamCountOptionText: {
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  teamCountOptionTextSelected: {
    fontWeight: '600',
    color: Colors.primary,
  },
  // Team select options
  teamSelectOptions: {
    gap: Spacing.xs,
  },
  teamSelectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    gap: Spacing.sm,
  },
  teamSelectOptionSelected: {
    backgroundColor: Colors.primaryLight,
  },
  teamSelectOptionText: {
    fontSize: FontSizes.md,
    color: Colors.text,
    flex: 1,
  },
  teamSelectOptionTextSelected: {
    fontWeight: '600',
    color: Colors.primary,
  },
});
