import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getTeamRecords, TeamRecordResult } from '../../database/queries';
import type { StatsStackParamList } from '../../navigation/StatsStackNavigator';

type RouteProp = NativeStackScreenProps<StatsStackParamList, 'TeamRecords'>['route'];

export default function TeamRecordsScreen() {
  const route = useRoute<RouteProp>();
  const { gameId } = route.params;

  const [records, setRecords] = useState<TeamRecordResult[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const data = await getTeamRecords(gameId);
      setRecords(data);
    } catch (error) {
      console.error('Failed to load team records:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [gameId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const renderTeamRecord = ({ item, index }: { item: TeamRecordResult; index: number }) => {
    const isWinning = item.winPercentage >= 50;

    // Format avg finish - lower is better (1.0 = always 1st)
    const avgFinishColor = item.avgFinish <= 1.5 ? Colors.success :
                           item.avgFinish >= 2.5 ? Colors.error : Colors.text;

    return (
      <View style={styles.recordCard}>
        <View style={styles.teamHeader}>
          <View style={styles.teamNames}>
            {item.playerNames.map((name, i) => (
              <View key={i} style={styles.playerChip}>
                <Text style={styles.playerChipText}>{name}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.winBadge, isWinning ? styles.winBadgePositive : styles.winBadgeNegative]}>
            <Text style={styles.winBadgeText}>{item.winPercentage.toFixed(0)}%</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.wins}-{item.losses}</Text>
            <Text style={styles.statLabel}>Record</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: avgFinishColor }]}>
              {item.avgFinish > 0 ? item.avgFinish.toFixed(1) : '-'}
            </Text>
            <Text style={styles.statLabel}>Avg Finish</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.placements.first}</Text>
            <Text style={styles.statLabel}>1st Place</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.totalGames}</Text>
            <Text style={styles.statLabel}>Games</Text>
          </View>
        </View>
      </View>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color={Colors.textMuted} />
      <Text style={styles.emptyTitle}>No Team Records</Text>
      <Text style={styles.emptySubtitle}>
        Play some games to see how different team combinations perform.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {records.length > 0 ? (
        <FlatList
          data={records}
          keyExtractor={(item, index) => item.playerIds.join('-') + index}
          renderItem={renderTeamRecord}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
          ListHeaderComponent={
            <Text style={styles.headerText}>
              Team combinations ranked by win percentage
            </Text>
          }
        />
      ) : !loading ? (
        <EmptyState />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: Spacing.md,
  },
  headerText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  recordCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  teamNames: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  playerChip: {
    backgroundColor: Colors.surfaceLight,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  playerChipText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    fontWeight: '500',
  },
  winBadge: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginLeft: Spacing.sm,
  },
  winBadgePositive: {
    backgroundColor: Colors.success + '30',
  },
  winBadgeNegative: {
    backgroundColor: Colors.error + '30',
  },
  winBadgeText: {
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
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
});
