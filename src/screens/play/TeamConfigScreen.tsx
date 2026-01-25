import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import type { PlayStackParamList, AssignmentMode } from '../../types';
import { getSettings, getPlayers, createSession } from '../../database/queries';

type NavigationProp = NativeStackNavigationProp<PlayStackParamList, 'TeamConfig'>;
type RouteProp = NativeStackScreenProps<PlayStackParamList, 'TeamConfig'>['route'];

const TEAM_OPTIONS = [2, 3, 4];

export default function TeamConfigScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const { selectedPlayerIds, gameId, reuseTeams } = route.params;

  const [teamCount, setTeamCount] = useState(2);
  const [teamNames, setTeamNames] = useState<string[]>(['Team 1', 'Team 2']);
  const [showCustomNames, setShowCustomNames] = useState(false);
  const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>('round-robin');
  const [removeAfterPick, setRemoveAfterPick] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDefaults();
  }, []);

  const loadDefaults = async () => {
    try {
      const settings = await getSettings();
      const maxTeams = Math.min(4, selectedPlayerIds.length);
      const defaultCount = Math.min(settings.defaultTeamCount, maxTeams);

      setTeamCount(defaultCount);
      setTeamNames(Array.from({ length: defaultCount }, (_, i) => `Team ${i + 1}`));
      setAssignmentMode(settings.defaultAssignmentMode);
      setRemoveAfterPick(settings.removePlayerAfterPick);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTeamCount = (count: number) => {
    setTeamCount(count);
    // Generate default team names
    const names = Array.from({ length: count }, (_, i) => `Team ${i + 1}`);
    setTeamNames(names);
  };

  const updateTeamName = (index: number, name: string) => {
    const newNames = [...teamNames];
    newNames[index] = name;
    setTeamNames(newNames);
  };

  const handleShuffle = () => {
    navigation.navigate('Randomizer', {
      selectedPlayerIds,
      gameId,
      teamCount,
      teamNames,
      assignmentMode,
      removeAfterPick,
    });
  };

  const handlePlaySameTeams = async () => {
    if (!reuseTeams) return;

    try {
      // Get player names for the teams
      const allPlayers = await getPlayers(false);
      const playerMap = new Map(allPlayers.map(p => [p.id, p.name]));

      // Create session and go directly to active game
      const session = await createSession(
        gameId,
        reuseTeams.map(t => ({
          name: t.name,
          playerIds: t.playerIds,
        }))
      );

      navigation.replace('ActiveGame', {
        sessionId: session.id,
        gameId,
        selectedPlayerIds,
      });
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const playersPerTeam = Math.floor(selectedPlayerIds.length / teamCount);
  const remainder = selectedPlayerIds.length % teamCount;
  const isUneven = remainder > 0;

  // Can't have more teams than players
  const maxTeams = Math.min(4, selectedPlayerIds.length);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>NUMBER OF TEAMS</Text>
        <View style={styles.teamCountRow}>
          {TEAM_OPTIONS.map((count) => (
            <TouchableOpacity
              key={count}
              style={[
                styles.teamCountButton,
                teamCount === count && styles.teamCountButtonSelected,
                count > maxTeams && styles.teamCountButtonDisabled,
              ]}
              onPress={() => updateTeamCount(count)}
              disabled={count > maxTeams}
            >
              <Text
                style={[
                  styles.teamCountText,
                  teamCount === count && styles.teamCountTextSelected,
                  count > maxTeams && styles.teamCountTextDisabled,
                ]}
              >
                {count}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.previewCard}>
        <Ionicons name="people" size={24} color={Colors.primary} />
        <View style={styles.previewInfo}>
          <Text style={styles.previewText}>
            {playersPerTeam} player{playersPerTeam !== 1 ? 's' : ''} per team
          </Text>
          {isUneven && (
            <Text style={styles.previewNote}>
              ({remainder} team{remainder !== 1 ? 's' : ''} will have an extra player)
            </Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ASSIGNMENT MODE</Text>
        <TouchableOpacity
          style={[
            styles.modeOption,
            assignmentMode === 'round-robin' && styles.modeOptionSelected,
          ]}
          onPress={() => setAssignmentMode('round-robin')}
        >
          <View style={styles.modeInfo}>
            <Ionicons
              name="sync"
              size={20}
              color={assignmentMode === 'round-robin' ? Colors.primary : Colors.textSecondary}
            />
            <View style={styles.modeTextContainer}>
              <Text style={styles.modeLabel}>Round Robin</Text>
              <Text style={styles.modeHint}>P1→T1, P2→T2, P3→T1, P4→T2...</Text>
            </View>
          </View>
          {assignmentMode === 'round-robin' && (
            <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeOption,
            assignmentMode === 'fill-first' && styles.modeOptionSelected,
          ]}
          onPress={() => setAssignmentMode('fill-first')}
        >
          <View style={styles.modeInfo}>
            <Ionicons
              name="layers"
              size={20}
              color={assignmentMode === 'fill-first' ? Colors.primary : Colors.textSecondary}
            />
            <View style={styles.modeTextContainer}>
              <Text style={styles.modeLabel}>Fill One Team First</Text>
              <Text style={styles.modeHint}>Fill Team 1 completely, then Team 2...</Text>
            </View>
          </View>
          {assignmentMode === 'fill-first' && (
            <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.switchRow}>
        <View style={styles.switchInfo}>
          <Ionicons name="eye-off-outline" size={20} color={Colors.textSecondary} />
          <View style={styles.switchTextContainer}>
            <Text style={styles.switchLabel}>Remove from wheel after pick</Text>
            <Text style={styles.switchHint}>Player disappears once assigned</Text>
          </View>
        </View>
        <Switch
          value={removeAfterPick}
          onValueChange={setRemoveAfterPick}
          trackColor={{ false: Colors.surfaceLight, true: Colors.primaryLight }}
          thumbColor={removeAfterPick ? Colors.primary : Colors.textMuted}
        />
      </View>

      <TouchableOpacity
        style={styles.customNamesToggle}
        onPress={() => setShowCustomNames(!showCustomNames)}
      >
        <Text style={styles.customNamesText}>Custom team names</Text>
        <Ionicons
          name={showCustomNames ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={Colors.textSecondary}
        />
      </TouchableOpacity>

      {showCustomNames && (
        <View style={styles.teamNamesSection}>
          {teamNames.map((name, index) => (
            <View key={index} style={styles.teamNameRow}>
              <View
                style={[
                  styles.teamColorDot,
                  { backgroundColor: getTeamColor(index) },
                ]}
              />
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
      )}

      {reuseTeams && (
        <TouchableOpacity style={styles.sameTeamsButton} onPress={handlePlaySameTeams}>
          <Ionicons name="refresh" size={24} color={Colors.text} />
          <Text style={styles.sameTeamsButtonText}>Play Again - Same Teams</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.shuffleButton} onPress={handleShuffle}>
        <Ionicons name="shuffle" size={24} color={Colors.text} />
        <Text style={styles.shuffleButtonText}>{reuseTeams ? 'New Random Teams' : 'Shuffle Teams!'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function getTeamColor(index: number): string {
  const colors = ['#EF4444', '#3B82F6', '#22C55E', '#F59E0B'];
  return colors[index % colors.length];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  teamCountRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  teamCountButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  teamCountButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceLight,
  },
  teamCountButtonDisabled: {
    opacity: 0.4,
  },
  teamCountText: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  teamCountTextSelected: {
    color: Colors.primary,
  },
  teamCountTextDisabled: {
    color: Colors.textMuted,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  previewInfo: {
    flex: 1,
  },
  previewText: {
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  previewNote: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  modeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modeOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceLight,
  },
  modeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  modeTextContainer: {
    flex: 1,
  },
  modeLabel: {
    fontSize: FontSizes.md,
    color: Colors.text,
    fontWeight: '500',
  },
  modeHint: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  switchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  switchTextContainer: {
    flex: 1,
  },
  switchLabel: {
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  switchHint: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  customNamesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  customNamesText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  teamNamesSection: {
    marginBottom: Spacing.lg,
  },
  teamNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  teamColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  teamNameInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  sameTeamsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  sameTeamsButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  shuffleButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
});
