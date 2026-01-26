import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../constants/theme';
import BannerAd from '../components/BannerAd';
import type { Player } from '../types';
import { getPlayers, addPlayer, deletePlayer, updatePlayer } from '../database/queries';

export default function PlayersScreen() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      const data = await getPlayers(false); // Get all players
      setPlayers(data);
    } catch (error) {
      console.error('Failed to load players:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPlayer = async () => {
    const name = newPlayerName.trim();
    if (!name) return;

    try {
      const player = await addPlayer({ name, isActive: true });
      setPlayers((prev) => [...prev, player].sort((a, b) => a.name.localeCompare(b.name)));
      setNewPlayerName('');
    } catch (error) {
      console.error('Failed to add player:', error);
      Alert.alert('Error', 'Failed to add player');
    }
  };

  const handleDeletePlayer = (player: Player) => {
    Alert.alert(
      'Delete Player',
      `Are you sure you want to delete ${player.name}? This will remove their game history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePlayer(player.id);
              setPlayers((prev) => prev.filter((p) => p.id !== player.id));
            } catch (error) {
              console.error('Failed to delete player:', error);
            }
          },
        },
      ]
    );
  };

  const handleToggleActive = async (player: Player) => {
    try {
      await updatePlayer(player.id, { isActive: !player.isActive });
      setPlayers((prev) =>
        prev.map((p) => (p.id === player.id ? { ...p, isActive: !p.isActive } : p))
      );
    } catch (error) {
      console.error('Failed to update player:', error);
    }
  };

  const renderPlayer = ({ item }: { item: Player }) => (
    <View style={[styles.playerCard, !item.isActive && styles.playerCardInactive]}>
      <View style={styles.playerInfo}>
        <View style={[styles.avatar, !item.isActive && styles.avatarInactive]}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={[styles.playerName, !item.isActive && styles.playerNameInactive]}>
          {item.name}
        </Text>
        {!item.isActive && <Text style={styles.inactiveLabel}>Inactive</Text>}
      </View>
      <View style={styles.playerActions}>
        <TouchableOpacity onPress={() => handleToggleActive(item)} style={styles.actionButton}>
          <Ionicons
            name={item.isActive ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color={Colors.textSecondary}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeletePlayer(item)} style={styles.actionButton}>
          <Ionicons name="trash-outline" size={22} color={Colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.addSection}>
        <TextInput
          style={styles.input}
          placeholder="Enter player name"
          placeholderTextColor={Colors.textMuted}
          value={newPlayerName}
          onChangeText={setNewPlayerName}
          onSubmitEditing={handleAddPlayer}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[styles.addButton, !newPlayerName.trim() && styles.addButtonDisabled]}
          onPress={handleAddPlayer}
          disabled={!newPlayerName.trim()}
        >
          <Ionicons name="add" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {players.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No Players Yet</Text>
          <Text style={styles.emptySubtitle}>Add your squad members above to get started.</Text>
        </View>
      ) : (
        <FlatList
          data={players}
          renderItem={renderPlayer}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <BannerAd />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  addSection: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  addButton: {
    backgroundColor: Colors.primary,
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: Colors.surfaceLight,
  },
  list: {
    padding: Spacing.md,
    paddingTop: 0,
  },
  playerCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  playerCardInactive: {
    opacity: 0.6,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInactive: {
    backgroundColor: Colors.surfaceLight,
  },
  avatarText: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  playerName: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    color: Colors.text,
  },
  playerNameInactive: {
    color: Colors.textSecondary,
  },
  inactiveLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  playerActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  actionButton: {
    padding: Spacing.sm,
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
  },
});
