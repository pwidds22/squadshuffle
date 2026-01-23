import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../constants/theme';
import type { GameSession, Game, Team } from '../types';
import { getSessions, getTeamsForSession, getGames, getPlayers } from '../database/queries';
import { getTeamColor } from '../utils/randomizer';

interface SessionWithDetails extends GameSession {
  game: Game | null;
  teams: (Team & { playerNames: string[] })[];
  winningTeamName: string | null;
}

export default function HistoryScreen() {
  const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [])
  );

  const loadSessions = async () => {
    try {
      const sessionsData = await getSessions();
      const gamesData = await getGames();
      const allPlayers = await getPlayers(false);

      // Create maps for quick lookup
      const gamesMap = new Map(gamesData.map((g) => [g.id, g]));
      const playerMap = new Map(allPlayers.map((p) => [p.id, p.name]));

      // Load details for each session
      const sessionsWithDetails: SessionWithDetails[] = await Promise.all(
        sessionsData.map(async (session) => {
          const teams = await getTeamsForSession(session.id);
          const teamsWithNames = teams.map((team) => ({
            ...team,
            playerNames: team.playerIds.map((id) => playerMap.get(id) || 'Unknown'),
          }));

          const winningTeam = session.winningTeamId
            ? teamsWithNames.find((t) => t.id === session.winningTeamId)
            : null;

          return {
            ...session,
            game: gamesMap.get(session.gameId) || null,
            teams: teamsWithNames,
            winningTeamName: winningTeam?.name || null,
          };
        })
      );

      setSessions(sessionsWithDetails);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadSessions();
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  const renderSession = ({ item }: { item: SessionWithDetails }) => {
    return (
      <View style={styles.sessionCard}>
        <View style={styles.sessionHeader}>
          <View style={styles.gameInfo}>
            {item.game && (
              <Ionicons
                name={item.game.iconName as keyof typeof Ionicons.glyphMap}
                size={20}
                color={Colors.primary}
              />
            )}
            <Text style={styles.gameName}>{item.game?.name || 'Unknown Game'}</Text>
          </View>
          <Text style={styles.sessionDate}>{formatDate(item.date)}</Text>
        </View>

        {item.winningTeamName ? (
          <View style={styles.winnerBanner}>
            <Ionicons name="trophy" size={16} color={Colors.accent} />
            <Text style={styles.winnerText}>{item.winningTeamName} won!</Text>
          </View>
        ) : item.isComplete ? (
          <View style={styles.tieBanner}>
            <Ionicons name="remove-circle-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.tieText}>No winner / Tie</Text>
          </View>
        ) : null}

        <View style={styles.teamsContainer}>
          {item.teams.map((team, index) => {
            const isWinner = team.id === item.winningTeamId;
            return (
              <View
                key={team.id}
                style={[styles.teamRow, isWinner && styles.teamRowWinner]}
              >
                <View style={styles.teamInfo}>
                  <View
                    style={[styles.teamDot, { backgroundColor: getTeamColor(index) }]}
                  />
                  <View style={styles.teamDetails}>
                    <Text style={[styles.teamName, isWinner && styles.teamNameWinner]}>
                      {team.name}
                    </Text>
                    <Text style={styles.teamPlayers}>
                      {team.playerNames.join(', ')}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.teamScore, isWinner && styles.teamScoreWinner]}>
                  {team.score ?? '-'}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (sessions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No Games Yet</Text>
          <Text style={styles.emptySubtitle}>
            Your game history will appear here after you play some games.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sessions}
        renderItem={renderSession}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      />
    </View>
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
  list: {
    padding: Spacing.md,
  },
  sessionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  gameInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  gameName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  sessionDate: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  winnerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.accentLight,
    paddingVertical: Spacing.xs,
  },
  winnerText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.accent,
  },
  tieBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surfaceLight,
    paddingVertical: Spacing.xs,
  },
  tieText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  teamsContainer: {
    padding: Spacing.md,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  teamRowWinner: {
    backgroundColor: Colors.surfaceLight,
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
  },
  teamDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  teamDetails: {
    flex: 1,
  },
  teamName: {
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  teamNameWinner: {
    fontWeight: '600',
  },
  teamPlayers: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  teamScore: {
    fontSize: FontSizes.lg,
    fontWeight: '500',
    color: Colors.textSecondary,
    minWidth: 40,
    textAlign: 'right',
  },
  teamScoreWinner: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
});
