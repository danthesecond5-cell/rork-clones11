import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useLoggingSettings } from '@/contexts/LoggingSettingsContext';

export default function SettingsScreen() {
  const {
    settings,
    setConsoleWarningsEnabled,
    setConsoleErrorsEnabled,
    setConsoleLogsEnabled,
    setProtocolLogsEnabled,
    resetToDefaults,
  } = useLoggingSettings();

  const handleResetToDefaults = () => {
    Alert.alert(
      'Reset to Defaults',
      'Are you sure you want to reset all logging settings to their default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetToDefaults();
            Alert.alert('Success', 'Logging settings have been reset to defaults.');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Console Logging</Text>
            <Text style={styles.sectionDescription}>
              Control which types of console messages are displayed during development and testing.
            </Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Console Warnings</Text>
                <Text style={styles.settingDescription}>
                  Show console.warn() messages from protocol diagnostics and error handling
                </Text>
              </View>
              <Switch
                value={settings.consoleWarningsEnabled}
                onValueChange={setConsoleWarningsEnabled}
                trackColor={{ false: '#3a3a3a', true: '#00ff88' }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Console Errors</Text>
                <Text style={styles.settingDescription}>
                  Show console.error() messages from error handling and validation
                </Text>
              </View>
              <Switch
                value={settings.consoleErrorsEnabled}
                onValueChange={setConsoleErrorsEnabled}
                trackColor={{ false: '#3a3a3a', true: '#00ff88' }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Console Logs</Text>
                <Text style={styles.settingDescription}>
                  Show console.log() messages from general application flow
                </Text>
              </View>
              <Switch
                value={settings.consoleLogsEnabled}
                onValueChange={setConsoleLogsEnabled}
                trackColor={{ false: '#3a3a3a', true: '#00ff88' }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Protocol Debug Logs</Text>
                <Text style={styles.settingDescription}>
                  Show detailed protocol operation and state transition logs
                </Text>
              </View>
              <Switch
                value={settings.protocolLogsEnabled}
                onValueChange={setProtocolLogsEnabled}
                trackColor={{ false: '#3a3a3a', true: '#00ff88' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions</Text>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleResetToDefaults}>
              <Text style={styles.actionButtonText}>Reset to Defaults</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>ℹ️ Note</Text>
            <Text style={styles.infoText}>
              Disabling console warnings can help reduce noise during testing, but some warnings may indicate important issues that need attention.
            </Text>
            <Text style={styles.infoText} style={{ marginTop: 8 }}>
              Changes take effect immediately. Reload the app if you need to see previously suppressed messages.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#00ff88',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 24,
  },
  section: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 18,
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 16,
  },
  actionButton: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: 'rgba(0,255,136,0.08)',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.2)',
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00ff88',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 17,
  },
});
