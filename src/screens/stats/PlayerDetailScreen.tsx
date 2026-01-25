import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import {
  getAdvancedPlayerStats,
  getPlayerDetailStats,
  AdvancedPlayerStats,
  PlayerStatsResult,
} from '../../database/queries';
import type { Game } from '../../types';
import type { StatsStackParamList } from '../../navigation/StatsStackNavigator';

type RouteProp = NativeStackScreenProps<StatsStackParamList, 'PlayerDetail'>['route'];

export default function PlayerDetailScreen() {
  const route = useRoute<RouteProp>();
  const { playerId, playerName } = route.params;

  const [advancedStats, setAdvancedStats] = useState<AdvancedPlayerStats | null>(null);
  const [byGame, setByGame] = useState<{ game: Game; stats: PlayerStatsResult }[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [advanced, detailed] = await Promise.all([
        getAdvancedPlayerStats(playerId),
        getPlayerDetailStats(playerId),
      ]);
      setAdvancedStats(advanced);
      setByGame(detailed.byGame);
    } catch (error) {
      console.error('Failed to load player stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [playerId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading || !advancedStats) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const { placements, strengthOfSchedule, headToHead, fieldSize, teamSize, weightedWins, avgFieldSize } = advancedStats;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.primary}
        />
      }
    >
      {/* Overall Stats Card */}
      <View style={styles.overallCard}>
        <Text style={styles.sectionTitle}>Overall Record</Text>

        <View style={styles.bigStats}>
          <View style={styles.bigStatItem}>
            <Text style={styles.bigStatValue}>{advancedStats.wins}</Text>
            <Text style={styles.bigStatLabel}>Wins</Text>
          </View>
          <View style={styles.bigStatDivider} />
          <View style={styles.bigStatItem}>
            <Text style={styles.bigStatValue}>{advancedStats.losses}</Text>
            <Text style={styles.bigStatLabel}>Losses</Text>
          </View>
          <View style={styles.bigStatDivider} />
          <View style={styles.bigStatItem}>
            <Text style={styles.bigStatValue}>{advancedStats.totalGames}</Text>
            <Text style={styles.bigStatLabel}>Games</Text>
          </View>
        </View>

        <View style={styles.secondaryStats}>
          <View style={styles.secondaryStatItem}>
            <Text style={styles.secondaryStatLabel}>Win %</Text>
            <Text style={styles.secondaryStatValue}>
              {advancedStats.winPercentage.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.secondaryStatItem}>
            <Text style={styles.secondaryStatLabel}>Adj Wins</Text>
            <Text style={[styles.secondaryStatValue, styles.accentColor]}>
              {weightedWins.toFixed(1)}
            </Text>
          </View>
          <View style={styles.secondaryStatItem}>
            <Text style={styles.secondaryStatLabel}>Margin</Text>
            <Text style={[
              styles.secondaryStatValue,
              advancedStats.avgMargin > 0 ? styles.positiveMargin : advancedStats.avgMargin < 0 ? styles.negativeMargin : null,
            ]}>
              {advancedStats.avgMargin > 0 ? '+' : ''}{advancedStats.avgMargin.toFixed(1)}
            </Text>
          </View>
        </View>
      </View>

      {/* Strength of Schedule & Field Context */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Competition Level</Text>
        <Text style={styles.sectionSubtitle}>How tough have their games been?</Text>

        <View style={styles.sosRow}>
          <View style={styles.sosItem}>
            <Text style={styles.sosLabel}>Strength of Schedule</Text>
            <Text style={[
              styles.sosValue,
              strengthOfSchedule > 55 ? styles.positiveMargin : strengthOfSchedule < 45 ? styles.negativeMargin : null,
            ]}>
              {strengthOfSchedule.toFixed(1)}
            </Text>
            <Text style={styles.sosHint}>
              {strengthOfSchedule >= 55 ? 'Tough opponents' : strengthOfSchedule <= 45 ? 'Weak opponents' : 'Average opponents'}
            </Text>
          </View>
          <View style={styles.sosDivider} />
          <View style={styles.sosItem}>
            <Text style={styles.sosLabel}>Avg Field Size</Text>
            <Text style={styles.sosValue}>{avgFieldSize.toFixed(1)}</Text>
            <Text style={styles.sosHint}>
              {avgFieldSize >= 3 ? 'Multi-team games' : 'Mostly 1v1'}
            </Text>
          </View>
        </View>

        {/* Field Size Breakdown - with record */}
        <View style={styles.breakdownSection}>
          <Text style={styles.breakdownTitle}>Record by Field Size</Text>
          <View style={styles.fieldSizeRecords}>
            {fieldSize.twoTeam.games > 0 && (
              <View style={styles.fieldSizeRow}>
                <Text style={styles.fieldSizeLabel}>vs 1 team (1v1)</Text>
                <Text style={[
                  styles.fieldSizeRecord,
                  fieldSize.twoTeam.wins > fieldSize.twoTeam.losses ? styles.positiveMargin :
                  fieldSize.twoTeam.wins < fieldSize.twoTeam.losses ? styles.negativeMargin : null,
                ]}>
                  {fieldSize.twoTeam.wins}W - {fieldSize.twoTeam.losses}L
                </Text>
                <Text style={styles.fieldSizeGames}>({fieldSize.twoTeam.games} games)</Text>
              </View>
            )}
            {fieldSize.threeTeam.games > 0 && (
              <View style={styles.fieldSizeRow}>
                <Text style={styles.fieldSizeLabel}>vs 2 teams (3-way)</Text>
                <Text style={[
                  styles.fieldSizeRecord,
                  fieldSize.threeTeam.wins > fieldSize.threeTeam.losses ? styles.positiveMargin :
                  fieldSize.threeTeam.wins < fieldSize.threeTeam.losses ? styles.negativeMargin : null,
                ]}>
                  {fieldSize.threeTeam.wins}W - {fieldSize.threeTeam.losses}L
                </Text>
                <Text style={styles.fieldSizeGames}>({fieldSize.threeTeam.games} games)</Text>
              </View>
            )}
            {fieldSize.fourPlusTeam.games > 0 && (
              <View style={styles.fieldSizeRow}>
                <Text style={styles.fieldSizeLabel}>vs 3+ teams</Text>
                <Text style={[
                  styles.fieldSizeRecord,
                  fieldSize.fourPlusTeam.wins > fieldSize.fourPlusTeam.losses ? styles.positiveMargin :
                  fieldSize.fourPlusTeam.wins < fieldSize.fourPlusTeam.losses ? styles.negativeMargin : null,
                ]}>
                  {fieldSize.fourPlusTeam.wins}W - {fieldSize.fourPlusTeam.losses}L
                </Text>
                <Text style={styles.fieldSizeGames}>({fieldSize.fourPlusTeam.games} games)</Text>
              </View>
            )}
          </View>
        </View>

        {/* Team Size Breakdown */}
        <View style={styles.breakdownSection}>
          <Text style={styles.breakdownTitle}>Games by Team Size</Text>
          <View style={styles.breakdownRow}>
            {teamSize.solo > 0 && (
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownValue}>{teamSize.solo}</Text>
                <Text style={styles.breakdownLabel}>Solo</Text>
              </View>
            )}
            {teamSize.twoVTwo > 0 && (
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownValue}>{teamSize.twoVTwo}</Text>
                <Text style={styles.breakdownLabel}>2v2</Text>
              </View>
            )}
            {teamSize.threeVThree > 0 && (
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownValue}>{teamSize.threeVThree}</Text>
                <Text style={styles.breakdownLabel}>3v3</Text>
              </View>
            )}
            {teamSize.fourPlus > 0 && (
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownValue}>{teamSize.fourPlus}</Text>
                <Text style={styles.breakdownLabel}>4v4+</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Placement Breakdown */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Finishes</Text>
        <View style={styles.placementRow}>
          <View style={styles.placementItem}>
            <View style={[styles.placementBadge, styles.goldBadge]}>
              <Text style={styles.placementBadgeText}>1st</Text>
            </View>
            <Text style={styles.placementValue}>{placements.first}</Text>
          </View>
          <View style={styles.placementItem}>
            <View style={[styles.placementBadge, styles.silverBadge]}>
              <Text style={styles.placementBadgeText}>2nd</Text>
            </View>
            <Text style={styles.placementValue}>{placements.second}</Text>
          </View>
          <View style={styles.placementItem}>
            <View style={[styles.placementBadge, styles.bronzeBadge]}>
              <Text style={styles.placementBadgeText}>3rd</Text>
            </View>
            <Text style={styles.placementValue}>{placements.third}</Text>
          </View>
          {placements.other > 0 && (
            <View style={styles.placementItem}>
              <View style={[styles.placementBadge, styles.otherBadge]}>
                <Text style={styles.placementBadgeText}>4th+</Text>
              </View>
              <Text style={styles.placementValue}>{placements.other}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Head-to-Head Records */}
      {headToHead.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Head-to-Head</Text>
          <Text style={styles.sectionSubtitle}>Record when on opposing teams</Text>
          {headToHead.map((h2h) => {
            // Build combined format string showing team size and field context
            // e.g., "2v2 in 2-team (3), 2v2 in 3-team (2)"
            const contextParts: string[] = [];

            // Determine the dominant team format
            const { solo, twoVTwo, threeVThree, fourPlus } = h2h.formatBreakdown;
            let teamFormat = '';
            if (solo > 0) teamFormat = '1v1';
            else if (twoVTwo > 0) teamFormat = '2v2';
            else if (threeVThree > 0) teamFormat = '3v3';
            else if (fourPlus > 0) teamFormat = '4v4+';

            // Show field size breakdown with team format context
            const { twoTeam, threeTeam, fourPlus: fourPlusField } = h2h.fieldSizeBreakdown;
            if (twoTeam > 0) contextParts.push(`2-team games: ${twoTeam}`);
            if (threeTeam > 0) contextParts.push(`3-team games: ${threeTeam}`);
            if (fourPlusField > 0) contextParts.push(`4+ team games: ${fourPlusField}`);

            // Also note if mixed formats
            const formatCounts = [solo, twoVTwo, threeVThree, fourPlus].filter(n => n > 0);
            const hasMixedFormats = formatCounts.length > 1;

            return (
              <View key={h2h.opponentId} style={styles.h2hRow}>
                <View style={styles.h2hInfo}>
                  <Text style={styles.h2hName}>{h2h.opponentName}</Text>
                  <Text style={styles.h2hGames}>
                    {h2h.totalGames} games faced
                    {teamFormat && !hasMixedFormats ? ` (${teamFormat})` : ''}
                  </Text>
                  {hasMixedFormats && (
                    <Text style={styles.h2hFormat}>
                      Mixed: {solo > 0 ? `1v1(${solo}) ` : ''}{twoVTwo > 0 ? `2v2(${twoVTwo}) ` : ''}{threeVThree > 0 ? `3v3(${threeVThree}) ` : ''}{fourPlus > 0 ? `4v4+(${fourPlus})` : ''}
                    </Text>
                  )}
                  {contextParts.length > 0 && (
                    <Text style={styles.h2hField}>{contextParts.join(', ')}</Text>
                  )}
                </View>
                <View style={styles.h2hStats}>
                  <Text style={[
                    styles.h2hRecord,
                    h2h.wins > h2h.losses ? styles.positiveMargin : h2h.wins < h2h.losses ? styles.negativeMargin : null,
                  ]}>
                    {h2h.wins}-{h2h.losses}
                    {h2h.ties > 0 ? `-${h2h.ties}` : ''}
                  </Text>
                  <Text style={styles.h2hWinRate}>{h2h.winPercentage.toFixed(0)}% win</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Per-Game Breakdown */}
      {byGame.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>By Game Type</Text>
          {byGame.map(({ game, stats }) => (
            <View key={game.id} style={styles.gameRow}>
              <View style={styles.gameInfo}>
                <Ionicons
                  name={game.iconName as keyof typeof Ionicons.glyphMap}
                  size={24}
                  color={Colors.primary}
                />
                <Text style={styles.gameName}>{game.name}</Text>
              </View>

              <View style={styles.gameStats}>
                <View style={styles.gameStatItem}>
                  <Text style={styles.gameStatValue}>
                    {stats.wins}-{stats.losses}
                  </Text>
                  <Text style={styles.gameStatLabel}>Record</Text>
                </View>
                <View style={styles.gameStatItem}>
                  <Text style={styles.gameStatValue}>{stats.winPercentage.toFixed(0)}%</Text>
                  <Text style={styles.gameStatLabel}>Win</Text>
                </View>
                <View style={styles.gameStatItem}>
                  <Text style={[
                    styles.gameStatValue,
                    stats.avgMargin > 0 ? styles.positiveMargin : stats.avgMargin < 0 ? styles.negativeMargin : null,
                  ]}>
                    {stats.avgMargin > 0 ? '+' : ''}{stats.avgMargin.toFixed(1)}
                  </Text>
                  <Text style={styles.gameStatLabel}>Margin</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {advancedStats.totalGames === 0 && (
        <View style={styles.noGamesContainer}>
          <Text style={styles.noGamesText}>No games played yet.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    textAlign: 'center',
    marginTop: Spacing.xxl,
  },
  overallCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  sectionSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
  },
  bigStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.md,
  },
  bigStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  bigStatValue: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  bigStatLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  bigStatDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  secondaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
    marginTop: Spacing.md,
  },
  secondaryStatItem: {
    alignItems: 'center',
  },
  secondaryStatLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  secondaryStatValue: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  accentColor: {
    color: Colors.accent,
  },
  positiveMargin: {
    color: Colors.success,
  },
  negativeMargin: {
    color: Colors.error,
  },
  // SOS Section
  sosRow: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  sosItem: {
    flex: 1,
    alignItems: 'center',
  },
  sosDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  sosLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  sosValue: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  sosHint: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  // Breakdown sections
  breakdownSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
    marginTop: Spacing.md,
  },
  breakdownTitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  breakdownItem: {
    alignItems: 'center',
  },
  breakdownValue: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  breakdownLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  fieldSizeRecords: {
    gap: Spacing.sm,
  },
  fieldSizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  fieldSizeLabel: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.text,
  },
  fieldSizeRecord: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginRight: Spacing.sm,
  },
  fieldSizeGames: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  // Placements
  placementRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  placementItem: {
    alignItems: 'center',
  },
  placementBadge: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  goldBadge: {
    backgroundColor: '#FFD700',
  },
  silverBadge: {
    backgroundColor: '#C0C0C0',
  },
  bronzeBadge: {
    backgroundColor: '#CD7F32',
  },
  otherBadge: {
    backgroundColor: Colors.surfaceLight,
  },
  placementBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: 'bold',
    color: '#000',
  },
  placementValue: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  // H2H
  h2hRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  h2hInfo: {
    flex: 1,
  },
  h2hName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  h2hGames: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  h2hFormat: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  h2hField: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  h2hStats: {
    alignItems: 'flex-end',
  },
  h2hRecord: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  h2hWinRate: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  // Games
  section: {
    marginTop: Spacing.md,
  },
  gameRow: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  gameInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  gameName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: Spacing.sm,
  },
  gameStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  gameStatItem: {
    alignItems: 'center',
  },
  gameStatValue: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  gameStatLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  noGamesContainer: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  noGamesText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
