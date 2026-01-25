import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getLeaderboard, getGames, LeaderboardEntry } from '../../database/queries';
import type { Game } from '../../types';
import type { StatsStackParamList } from '../../navigation/StatsStackNavigator';

type NavigationProp = NativeStackNavigationProp<StatsStackParamList, 'StatsHome'>;

export default function StatsHomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [stats, setStats] = useState<LeaderboardEntry[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [leaderboard, gamesList] = await Promise.all([
        getLeaderboard(selectedGameId),
        getGames(),
      ]);
      setStats(leaderboard);
      setGames(gamesList);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedGameId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleGameFilter = (gameId: string | undefined) => {
    setSelectedGameId(gameId);
  };

  // Reload when game filter changes
  useEffect(() => {
    setLoading(true);
    loadData();
  }, [selectedGameId, loadData]);

  const renderStatRow = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const rank = index + 1;
    const isTopThree = rank <= 3;
    const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32']; // Gold, Silver, Bronze

    // Format SOS - above 50 is harder schedule, below is easier
    const sosColor = item.strengthOfSchedule >= 55 ? Colors.success :
                     item.strengthOfSchedule <= 45 ? Colors.error : Colors.text;

    // Format avg finish - lower is better (1.0 = always 1st)
    const avgFinishColor = item.avgFinish <= 1.5 ? Colors.success :
                           item.avgFinish >= 2.5 ? Colors.error : Colors.text;

    return (
      <TouchableOpacity
        style={styles.statRow}
        onPress={() => navigation.navigate('PlayerDetail', {
          playerId: item.playerId,
          playerName: item.playerName,
        })}
      >
        <View style={styles.rankContainer}>
          {isTopThree ? (
            <View style={[styles.medal, { backgroundColor: medalColors[rank - 1] }]}>
              <Text style={styles.medalText}>{rank}</Text>
            </View>
          ) : (
            <Text style={styles.rankText}>{rank}</Text>
          )}
        </View>

        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>{item.playerName}</Text>
          <Text style={styles.record}>
            {item.wins}W - {item.losses}L ({item.totalGames} games)
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.winPercentage.toFixed(0)}%</Text>
            <Text style={styles.statLabel}>Win</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: avgFinishColor }]}>
              {item.avgFinish > 0 ? item.avgFinish.toFixed(1) : '-'}
            </Text>
            <Text style={styles.statLabel}>Avg</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {item.placements.first}
            </Text>
            <Text style={styles.statLabel}>1st</Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="trophy-outline" size={64} color={Colors.textMuted} />
      <Text style={styles.emptyTitle}>No Stats Yet</Text>
      <Text style={styles.emptySubtitle}>
        Play some games to see who's really the best on your squad.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Game Filter */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity
            style={[styles.filterChip, !selectedGameId && styles.filterChipActive]}
            onPress={() => handleGameFilter(undefined)}
          >
            <Text style={[styles.filterText, !selectedGameId && styles.filterTextActive]}>
              Overall
            </Text>
          </TouchableOpacity>
          {games.map((game) => (
            <TouchableOpacity
              key={game.id}
              style={[styles.filterChip, selectedGameId === game.id && styles.filterChipActive]}
              onPress={() => handleGameFilter(game.id)}
            >
              <Ionicons
                name={game.iconName as keyof typeof Ionicons.glyphMap}
                size={16}
                color={selectedGameId === game.id ? Colors.text : Colors.textSecondary}
                style={styles.filterIcon}
              />
              <Text style={[styles.filterText, selectedGameId === game.id && styles.filterTextActive]}>
                {game.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Leaderboard */}
      {stats.length > 0 ? (
        <FlatList
          data={stats}
          keyExtractor={(item) => item.playerId}
          renderItem={renderStatRow}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
        />
      ) : !loading ? (
        <EmptyState />
      ) : null}

      {/* Team Records Button */}
      <TouchableOpacity
        style={styles.teamRecordsButton}
        onPress={() => navigation.navigate('TeamRecords', { gameId: selectedGameId })}
      >
        <Ionicons name="people" size={20} color={Colors.text} />
        <Text style={styles.teamRecordsText}>View Team Records</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  filterContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterScroll: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    marginRight: Spacing.sm,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterIcon: {
    marginRight: Spacing.xs,
  },
  filterText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.text,
    fontWeight: '600',
  },
  listContent: {
    padding: Spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  rankContainer: {
    width: 36,
    alignItems: 'center',
  },
  medal: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalText: {
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
    color: '#000',
  },
  rankText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  playerInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  playerName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  record: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginRight: Spacing.sm,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 40,
  },
  statValue: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  positiveMargin: {
    color: Colors.success,
  },
  negativeMargin: {
    color: Colors.error,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    maxWidth: 280,
  },
  teamRecordsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  teamRecordsText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
});
