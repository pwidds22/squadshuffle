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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Picker } from '@react-native-picker/picker';
import { Colors, Spacing, FontSizes, BorderRadius } from '../constants/theme';
import { getPlayers, getGames, createSession, updateTeamScore, endSession, getGameById } from '../database/queries';
import { getTeamColor } from '../utils/randomizer';
import type { Player, Game } from '../types';
import type { HistoryStackParamList } from '../navigation/HistoryStackNavigator';

type NavigationProp = NativeStackNavigationProp<HistoryStackParamList, 'ManualGameEntry'>;

const DEFAULT_TEAM_NAMES = ['Team 1', 'Team 2', 'Team 3', 'Team 4'];

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

  // Update team count
  const handleTeamCountChange = (count: number) => {
    setTeamCount(count);
    // Extend or trim team names
    const newNames = [...teamNames];
    while (newNames.length < count) {
      newNames.push(DEFAULT_TEAM_NAMES[newNames.length] || `Team ${newNames.length + 1}`);
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
      const game = await getGameById(selectedGameId!);
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
          <Text style={styles.sectionTitle}>Game</Text>
          {games.length === 0 ? (
            <Text style={styles.emptyText}>No games yet. Create one in the Play tab first.</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.gamesRow}
            >
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
          )}
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

        {/* Team Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Teams</Text>
          <View style={styles.teamCountRow}>
            {[2, 3, 4].map((count) => (
              <TouchableOpacity
                key={count}
                style={[
                  styles.teamCountButton,
                  teamCount === count && styles.teamCountButtonSelected,
                ]}
                onPress={() => handleTeamCountChange(count)}
              >
                <Text
                  style={[
                    styles.teamCountText,
                    teamCount === count && styles.teamCountTextSelected,
                  ]}
                >
                  {count}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Team Names */}
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
            <View style={styles.assignmentList}>
              {selectedPlayerIds.map((playerId) => {
                const player = players.find((p) => p.id === playerId);
                const assignedTeam = playerAssignments[playerId];
                return (
                  <View key={playerId} style={styles.assignmentRow}>
                    <Text style={styles.assignmentPlayerName}>{player?.name}</Text>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={assignedTeam ?? -1}
                        onValueChange={(value) => {
                          if (value !== -1) {
                            assignPlayerToTeam(playerId, value as number);
                          }
                        }}
                        style={styles.picker}
                        dropdownIconColor={Colors.textMuted}
                      >
                        <Picker.Item label="Select team..." value={-1} color={Colors.textMuted} />
                        {teamNames.slice(0, teamCount).map((name, index) => (
                          <Picker.Item
                            key={index}
                            label={name || `Team ${index + 1}`}
                            value={index}
                            color={Colors.text}
                          />
                        ))}
                      </Picker>
                    </View>
                  </View>
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
  // Team count
  teamCountRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  teamCountButton: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  teamCountButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  teamCountText: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  teamCountTextSelected: {
    color: Colors.primary,
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
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  assignmentPlayerName: {
    fontSize: FontSizes.md,
    color: Colors.text,
    flex: 1,
  },
  pickerContainer: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    minWidth: 140,
  },
  picker: {
    color: Colors.text,
    height: 44,
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
});
