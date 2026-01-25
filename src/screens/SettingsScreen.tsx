import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../constants/theme';
import { getSettings, setSetting, clearAllData } from '../database/queries';
import type { AppSettings, AssignmentMode } from '../types';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings>({
    defaultTeamCount: 2,
    defaultAssignmentMode: 'round-robin',
    removePlayerAfterPick: true,
  });
  const [showTeamCountModal, setShowTeamCountModal] = useState(false);
  const [showModeModal, setShowModeModal] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const loaded = await getSettings();
      setSettings(loaded);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const updateSetting = async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    try {
      await setSetting(key, value);
      setSettings((prev) => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error('Failed to save setting:', error);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all players, games, and history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllData();
              Alert.alert('Success', 'All data has been cleared.');
            } catch (error) {
              console.error('Failed to clear data:', error);
              Alert.alert('Error', 'Failed to clear data. Please try again.');
            }
          },
        },
      ]
    );
  };

  const getModeLabel = (mode: AssignmentMode): string => {
    return mode === 'round-robin' ? 'Round Robin' : 'Fill One First';
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Game Defaults</Text>

        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => setShowTeamCountModal(true)}
        >
          <View style={styles.settingInfo}>
            <Ionicons name="people-outline" size={22} color={Colors.primary} />
            <Text style={styles.settingLabel}>Default Team Count</Text>
          </View>
          <View style={styles.settingValue}>
            <Text style={styles.settingValueText}>{settings.defaultTeamCount}</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => setShowModeModal(true)}
        >
          <View style={styles.settingInfo}>
            <Ionicons name="git-branch-outline" size={22} color={Colors.primary} />
            <Text style={styles.settingLabel}>Assignment Mode</Text>
          </View>
          <View style={styles.settingValue}>
            <Text style={styles.settingValueText}>
              {getModeLabel(settings.defaultAssignmentMode)}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </View>
        </TouchableOpacity>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="exit-outline" size={22} color={Colors.primary} />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Remove After Pick</Text>
              <Text style={styles.settingHint}>Remove player from wheel after selection</Text>
            </View>
          </View>
          <Switch
            value={settings.removePlayerAfterPick}
            onValueChange={(value) => updateSetting('removePlayerAfterPick', value)}
            trackColor={{ false: Colors.surfaceLight, true: Colors.primaryLight }}
            thumbColor={settings.removePlayerAfterPick ? Colors.primary : Colors.textMuted}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>

        <TouchableOpacity style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="download-outline" size={22} color={Colors.primary} />
            <Text style={styles.settingLabel}>Export Data</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.settingRow, styles.dangerRow]} onPress={handleClearData}>
          <View style={styles.settingInfo}>
            <Ionicons name="trash-outline" size={22} color={Colors.error} />
            <Text style={[styles.settingLabel, styles.dangerText]}>Clear All Data</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>

        <View style={styles.aboutCard}>
          <Text style={styles.appName}>Squad Shuffle</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appDescription}>
            The team randomizer that remembers your squad and tracks who really wins.
          </Text>
        </View>
      </View>

      {/* Team Count Modal */}
      <Modal
        visible={showTeamCountModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowTeamCountModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTeamCountModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Default Team Count</Text>
            {[2, 3, 4].map((count) => (
              <TouchableOpacity
                key={count}
                style={[
                  styles.optionRow,
                  settings.defaultTeamCount === count && styles.optionRowSelected,
                ]}
                onPress={() => {
                  updateSetting('defaultTeamCount', count);
                  setShowTeamCountModal(false);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    settings.defaultTeamCount === count && styles.optionTextSelected,
                  ]}
                >
                  {count} Teams
                </Text>
                {settings.defaultTeamCount === count && (
                  <Ionicons name="checkmark" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Assignment Mode Modal */}
      <Modal
        visible={showModeModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowModeModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModeModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assignment Mode</Text>
            <TouchableOpacity
              style={[
                styles.optionRow,
                settings.defaultAssignmentMode === 'round-robin' && styles.optionRowSelected,
              ]}
              onPress={() => {
                updateSetting('defaultAssignmentMode', 'round-robin');
                setShowModeModal(false);
              }}
            >
              <View style={styles.optionInfo}>
                <Text
                  style={[
                    styles.optionText,
                    settings.defaultAssignmentMode === 'round-robin' && styles.optionTextSelected,
                  ]}
                >
                  Round Robin
                </Text>
                <Text style={styles.optionHint}>Alternate: Team 1, Team 2, Team 1...</Text>
              </View>
              {settings.defaultAssignmentMode === 'round-robin' && (
                <Ionicons name="checkmark" size={20} color={Colors.primary} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionRow,
                settings.defaultAssignmentMode === 'fill-first' && styles.optionRowSelected,
              ]}
              onPress={() => {
                updateSetting('defaultAssignmentMode', 'fill-first');
                setShowModeModal(false);
              }}
            >
              <View style={styles.optionInfo}>
                <Text
                  style={[
                    styles.optionText,
                    settings.defaultAssignmentMode === 'fill-first' && styles.optionTextSelected,
                  ]}
                >
                  Fill One First
                </Text>
                <Text style={styles.optionHint}>Fill Team 1 first, then Team 2...</Text>
              </View>
              {settings.defaultAssignmentMode === 'fill-first' && (
                <Ionicons name="checkmark" size={20} color={Colors.primary} />
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.md,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  settingRow: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  settingHint: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  settingValueText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  dangerRow: {
    borderColor: Colors.error,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  dangerText: {
    color: Colors.error,
  },
  aboutCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  appName: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  appVersion: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  appDescription: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: 20,
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
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionRowSelected: {
    borderColor: Colors.primary,
  },
  optionInfo: {
    flex: 1,
  },
  optionText: {
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  optionTextSelected: {
    fontWeight: '600',
  },
  optionHint: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
