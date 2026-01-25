import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import type { PlayStackParamList, Game } from '../../types';
import { getGames, addGame, deleteGame } from '../../database/queries';

type NavigationProp = NativeStackNavigationProp<PlayStackParamList, 'GameSelection'>;
type RouteProp = NativeStackScreenProps<PlayStackParamList, 'GameSelection'>['route'];

// Available icons for games
const GAME_ICONS = [
  'game-controller',
  'golf',
  'help-circle',
  'grid',
  'dice',
  'football',
  'basketball',
  'tennisball',
  'bowling-ball',
  'american-football',
  'car-sport',
  'bicycle',
  'musical-notes',
  'film',
  'tv',
  'desktop',
  'phone-portrait',
  'extension-puzzle',
  'rocket',
  'planet',
  'trophy',
  'medal',
  'ribbon',
  'star',
  'heart',
  'flame',
  'flash',
  'thumbs-up',
  'beer',
  'wine',
  'cafe',
  'pizza',
];

export default function GameSelectionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const { selectedPlayerIds } = route.params;

  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGameName, setNewGameName] = useState('');
  const [newGameIcon, setNewGameIcon] = useState('game-controller');
  const [lowerScoreWins, setLowerScoreWins] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      const data = await getGames();
      setGames(data);
    } catch (error) {
      console.error('Failed to load games:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGame = async () => {
    if (!newGameName.trim()) return;

    setIsCreating(true);
    try {
      const newGame = await addGame({
        name: newGameName.trim(),
        iconName: newGameIcon,
        lowerScoreWins,
      });
      setGames((prev) => [...prev, newGame].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedGameId(newGame.id);
      setShowCreateModal(false);
      resetModalState();
    } catch (error) {
      console.error('Failed to create game:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const resetModalState = () => {
    setNewGameName('');
    setNewGameIcon('game-controller');
    setLowerScoreWins(false);
  };

  const handleContinue = () => {
    if (selectedGameId) {
      navigation.navigate('TeamConfig', {
        selectedPlayerIds,
        gameId: selectedGameId,
      });
    }
  };

  const handleDeleteGame = (game: Game) => {
    Alert.alert(
      'Delete Game',
      `Are you sure you want to delete "${game.name}"? This will also delete all game history and stats for this game type.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGame(game.id);
              setGames((prev) => prev.filter((g) => g.id !== game.id));
              if (selectedGameId === game.id) {
                setSelectedGameId(null);
              }
            } catch (error) {
              console.error('Failed to delete game:', error);
              Alert.alert('Error', 'Failed to delete game. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderGame = ({ item }: { item: Game }) => {
    const isSelected = selectedGameId === item.id;
    return (
      <TouchableOpacity
        style={[styles.gameCard, isSelected && styles.gameCardSelected]}
        onPress={() => setSelectedGameId(item.id)}
        activeOpacity={0.7}
      >
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteGame(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
        <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
          <Ionicons
            name={item.iconName as keyof typeof Ionicons.glyphMap}
            size={36}
            color={isSelected ? Colors.text : Colors.primary}
          />
        </View>
        <Text style={styles.gameName}>{item.name}</Text>
        {item.lowerScoreWins && (
          <Text style={styles.scoringType}>Lower wins</Text>
        )}
        {isSelected && (
          <View style={styles.selectedBadge}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderCreateCard = () => (
    <TouchableOpacity
      style={styles.createCard}
      onPress={() => setShowCreateModal(true)}
      activeOpacity={0.7}
    >
      <View style={styles.createIconContainer}>
        <Ionicons name="add" size={36} color={Colors.primary} />
      </View>
      <Text style={styles.createText}>Create Game</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {games.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="game-controller-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No Games Yet</Text>
          <Text style={styles.emptySubtitle}>Create your first game type to get started</Text>
          <TouchableOpacity
            style={styles.createFirstButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={24} color={Colors.text} />
            <Text style={styles.createFirstButtonText}>Create Game</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={games}
          renderItem={renderGame}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={renderCreateCard}
        />
      )}

      {games.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.continueButton, !selectedGameId && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={!selectedGameId}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>
      )}

      {/* Create Game Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Game</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Game Name</Text>
            <TextInput
              style={styles.input}
              value={newGameName}
              onChangeText={setNewGameName}
              placeholder="e.g., Trivia Night"
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />

            <Text style={styles.inputLabel}>Icon</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.iconPicker}
              contentContainerStyle={styles.iconPickerContent}
            >
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
                    color={newGameIcon === icon ? Colors.text : Colors.textSecondary}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>Lower score wins</Text>
                <Text style={styles.switchHint}>Enable for golf-style scoring</Text>
              </View>
              <Switch
                value={lowerScoreWins}
                onValueChange={setLowerScoreWins}
                trackColor={{ false: Colors.surfaceLight, true: Colors.primaryLight }}
                thumbColor={lowerScoreWins ? Colors.primary : Colors.textMuted}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.createButton,
                (!newGameName.trim() || isCreating) && styles.createButtonDisabled,
              ]}
              onPress={handleCreateGame}
              disabled={!newGameName.trim() || isCreating}
            >
              <Text style={styles.createButtonText}>
                {isCreating ? 'Creating...' : 'Create Game'}
              </Text>
            </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoid: {
    flex: 1,
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
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  createFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  createFirstButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  grid: {
    padding: Spacing.md,
  },
  row: {
    justifyContent: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  gameCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gameCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceLight,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  iconContainerSelected: {
    backgroundColor: Colors.primary,
  },
  gameName: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
  },
  scoringType: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  selectedBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },
  deleteButton: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    padding: Spacing.xs,
    zIndex: 1,
  },
  createCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  createIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  createText: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  footer: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  continueButtonDisabled: {
    backgroundColor: Colors.surfaceLight,
  },
  continueButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    color: Colors.text,
  },
  inputLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  iconPicker: {
    marginBottom: Spacing.lg,
  },
  iconPickerContent: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOptionSelected: {
    backgroundColor: Colors.primary,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  switchInfo: {
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
  createButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: Colors.surfaceLight,
  },
  createButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
});
