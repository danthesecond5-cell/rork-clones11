import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
  Platform,
} from 'react-native';
import { X, AlertCircle, Info } from 'lucide-react-native';
import { useProtocol, LogLevel } from '@/contexts/ProtocolContext';

interface LoggingSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function LoggingSettingsModal({
  visible,
  onClose,
}: LoggingSettingsModalProps) {
  const { loggingSettings, updateLoggingSettings, isExpoGo } = useProtocol();

  const logLevels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'none'];

  const handleLogLevelChange = (level: LogLevel) => {
    updateLoggingSettings({ level });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Logging Settings</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Expo Go Notice */}
          {isExpoGo && (
            <View style={styles.noticeCard}>
              <View style={styles.noticeHeader}>
                <Info size={18} color="#3b82f6" />
                <Text style={styles.noticeTitle}>Running in Expo Go</Text>
              </View>
              <Text style={styles.noticeText}>
                Some native features are disabled in Expo Go. Logging warnings for these features are hidden by default.
              </Text>
            </View>
          )}

          {/* Enable/Disable Logging */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>General</Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Enable Logging</Text>
                <Text style={styles.settingDescription}>
                  Control whether logs are captured and stored
                </Text>
              </View>
              <Switch
                value={loggingSettings.enabled}
                onValueChange={(value) => updateLoggingSettings({ enabled: value })}
                trackColor={{ false: '#3e3e3e', true: '#00ff88' }}
                thumbColor="#ffffff"
                ios_backgroundColor="#3e3e3e"
              />
            </View>
          </View>

          {/* Log Level */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Log Level</Text>
            <Text style={styles.sectionDescription}>
              Control which messages are logged based on severity
            </Text>
            
            {logLevels.map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.logLevelOption,
                  loggingSettings.level === level && styles.logLevelOptionActive,
                ]}
                onPress={() => handleLogLevelChange(level)}
              >
                <View style={styles.logLevelInfo}>
                  <Text style={[
                    styles.logLevelLabel,
                    loggingSettings.level === level && styles.logLevelLabelActive,
                  ]}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                  <Text style={styles.logLevelDescription}>
                    {level === 'debug' && 'All logs including debug information'}
                    {level === 'info' && 'Informational messages and above'}
                    {level === 'warn' && 'Warnings and errors only'}
                    {level === 'error' && 'Errors only'}
                    {level === 'none' && 'No logging (not recommended)'}
                  </Text>
                </View>
                {loggingSettings.level === level && (
                  <View style={styles.checkmark} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Filter Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Filter Options</Text>
            <Text style={styles.sectionDescription}>
              Hide specific categories of warnings to reduce console noise
            </Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Hide Protocol Warnings</Text>
                <Text style={styles.settingDescription}>
                  Hide warnings related to protocol injection
                </Text>
              </View>
              <Switch
                value={loggingSettings.hideProtocolWarnings}
                onValueChange={(value) => updateLoggingSettings({ hideProtocolWarnings: value })}
                trackColor={{ false: '#3e3e3e', true: '#00ff88' }}
                thumbColor="#ffffff"
                ios_backgroundColor="#3e3e3e"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Hide WebRTC Warnings</Text>
                <Text style={styles.settingDescription}>
                  Hide warnings from WebRTC components
                </Text>
              </View>
              <Switch
                value={loggingSettings.hideWebRTCWarnings}
                onValueChange={(value) => updateLoggingSettings({ hideWebRTCWarnings: value })}
                trackColor={{ false: '#3e3e3e', true: '#00ff88' }}
                thumbColor="#ffffff"
                ios_backgroundColor="#3e3e3e"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Hide Native Module Warnings</Text>
                <Text style={styles.settingDescription}>
                  Hide warnings about unavailable native modules
                </Text>
              </View>
              <Switch
                value={loggingSettings.hideNativeModuleWarnings}
                onValueChange={(value) => updateLoggingSettings({ hideNativeModuleWarnings: value })}
                trackColor={{ false: '#3e3e3e', true: '#00ff88' }}
                thumbColor="#ffffff"
                ios_backgroundColor="#3e3e3e"
              />
            </View>
          </View>

          {/* Help Text */}
          <View style={styles.helpCard}>
            <AlertCircle size={16} color="#6b7280" />
            <Text style={styles.helpText}>
              Logging settings affect what messages are captured and stored. They don't affect the app's functionality, only the diagnostic information available for troubleshooting.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f1f',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  noticeCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3b82f6',
  },
  noticeText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 16,
    lineHeight: 18,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 18,
  },
  logLevelOption: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  logLevelOptionActive: {
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderColor: '#00ff88',
  },
  logLevelInfo: {
    flex: 1,
  },
  logLevelLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 4,
  },
  logLevelLabelActive: {
    color: '#00ff88',
  },
  logLevelDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 18,
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#00ff88',
    marginLeft: 12,
  },
  helpCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    gap: 12,
  },
  helpText: {
    flex: 1,
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
});
