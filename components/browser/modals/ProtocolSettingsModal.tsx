import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import {
  X,
  Shield,
  ShieldOff,
  Lock,
  Unlock,
  Settings,
  Trash2,
  ChevronRight,
  Eye,
  EyeOff,
  Zap,
  Monitor,
  FlaskConical,
  Check,
  AlertTriangle,
  Globe,
  Cpu,
  Brain,
  Fingerprint,
  Activity,
  Gauge,
  Sparkles,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useProtocol, ProtocolType } from '@/contexts/ProtocolContext';

interface ProtocolSettingsModalProps {
  visible: boolean;
  currentHostname: string;
  onClose: () => void;
}

export default function ProtocolSettingsModal({
  visible,
  currentHostname,
  onClose,
}: ProtocolSettingsModalProps) {
  const {
    developerModeEnabled,
    toggleDeveloperMode,
    setDeveloperModeWithPin,
    developerPin,
    setDeveloperPin,
    presentationMode,
    togglePresentationMode,
    showTestingWatermark,
    setShowTestingWatermark,
    activeProtocol,
    setActiveProtocol,
    protocols,
    standardSettings,
    allowlistSettings,
    protectedSettings,
    harnessSettings,
    claudeSettings,
    updateStandardSettings,
    updateAllowlistSettings,
    updateProtectedSettings,
    updateHarnessSettings,
    updateClaudeSettings,
    addAllowlistDomain,
    removeAllowlistDomain,
    isAllowlisted,
    httpsEnforced,
    setHttpsEnforced,
    mlSafetyEnabled,
    setMlSafetyEnabled,
  } = useProtocol();

  const [pinInput, setPinInput] = useState('');
  const [showPinEntry, setShowPinEntry] = useState(false);
  const [domainInput, setDomainInput] = useState('');
  const [expandedProtocol, setExpandedProtocol] = useState<ProtocolType | null>(activeProtocol);

  const currentAllowlisted = useMemo(() => {
    return isAllowlisted(currentHostname);
  }, [isAllowlisted, currentHostname]);

  const handlePinSubmit = async () => {
    if (pinInput.length < 4) {
      Alert.alert('Invalid PIN', 'PIN must be at least 4 characters.');
      return;
    }
    
    const success = await setDeveloperModeWithPin(pinInput);
    if (success) {
      setShowPinEntry(false);
      setPinInput('');
      Alert.alert('Developer Mode', developerPin ? 'Developer mode enabled.' : 'PIN set. Developer mode enabled.');
    } else {
      Alert.alert('Invalid PIN', 'The PIN you entered is incorrect.');
      setPinInput('');
    }
  };

  const handleToggleDeveloperMode = () => {
    if (developerModeEnabled) {
      Alert.alert(
        'Disable Developer Mode',
        'This will lock all protocol settings and the allowlist. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Disable', style: 'destructive', onPress: toggleDeveloperMode },
        ]
      );
    } else {
      if (developerPin) {
        setShowPinEntry(true);
      } else {
        Alert.alert(
          'Set Developer PIN',
          'You need to set a PIN to enable developer mode.',
          [{ text: 'OK', onPress: () => setShowPinEntry(true) }]
        );
      }
    }
  };

  const handleAddDomain = () => {
    if (!domainInput.trim()) return;
    addAllowlistDomain(domainInput);
    setDomainInput('');
  };

  const handleAddCurrentSite = () => {
    if (!currentHostname) return;
    addAllowlistDomain(currentHostname);
  };

  const toggleProtocol = (protocol: ProtocolType) => {
    setExpandedProtocol(expandedProtocol === protocol ? null : protocol);
  };

  const handleOpenProtectedPreview = () => {
    onClose();
    router.push('/protected-preview');
  };

  const handleOpenTestHarness = () => {
    onClose();
    router.push('/test-harness');
  };

  const renderProtocolSettings = (protocol: ProtocolType) => {
    if (!developerModeEnabled) {
      return (
        <View style={styles.lockedNotice}>
          <Lock size={14} color="rgba(255,255,255,0.4)" />
          <Text style={styles.lockedNoticeText}>
            Enable developer mode to customize settings
          </Text>
        </View>
      );
    }

    switch (protocol) {
      case 'standard':
        return (
          <View style={styles.settingsGroup}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Auto Inject</Text>
                <Text style={styles.settingHint}>Automatically inject media on page load</Text>
              </View>
              <Switch
                value={standardSettings.autoInject}
                onValueChange={(v) => updateStandardSettings({ autoInject: v })}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#00ff88' }}
                thumbColor={standardSettings.autoInject ? '#ffffff' : '#888'}
              />
            </View>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Stealth by Default</Text>
                <Text style={styles.settingHint}>Hide injection from site detection</Text>
              </View>
              <Switch
                value={standardSettings.stealthByDefault}
                onValueChange={(v) => updateStandardSettings({ stealthByDefault: v })}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#ff6b35' }}
                thumbColor={standardSettings.stealthByDefault ? '#ffffff' : '#888'}
              />
            </View>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Inject Motion Data</Text>
                <Text style={styles.settingHint}>Include accelerometer/gyroscope simulation</Text>
              </View>
              <Switch
                value={standardSettings.injectMotionData}
                onValueChange={(v) => updateStandardSettings({ injectMotionData: v })}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#00aaff' }}
                thumbColor={standardSettings.injectMotionData ? '#ffffff' : '#888'}
              />
            </View>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Loop Video</Text>
                <Text style={styles.settingHint}>Loop video when it ends</Text>
              </View>
              <Switch
                value={standardSettings.loopVideo}
                onValueChange={(v) => updateStandardSettings({ loopVideo: v })}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#00ff88' }}
                thumbColor={standardSettings.loopVideo ? '#ffffff' : '#888'}
              />
            </View>
          </View>
        );

      case 'allowlist':
        return (
          <View style={styles.settingsGroup}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Enable Allowlist</Text>
                <Text style={styles.settingHint}>Only inject on allowed domains</Text>
              </View>
              <Switch
                value={allowlistSettings.enabled}
                onValueChange={(v) => updateAllowlistSettings({ enabled: v })}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#00ff88' }}
                thumbColor={allowlistSettings.enabled ? '#ffffff' : '#888'}
              />
            </View>

            {currentHostname && (
              <View style={styles.currentSiteRow}>
                <Globe size={14} color="#00aaff" />
                <Text style={styles.currentSiteText}>{currentHostname}</Text>
                <View style={[
                  styles.statusBadge,
                  currentAllowlisted ? styles.statusAllowed : styles.statusBlocked,
                ]}>
                  <Text style={styles.statusBadgeText}>
                    {currentAllowlisted ? 'Allowed' : 'Blocked'}
                  </Text>
                </View>
                {!currentAllowlisted && (
                  <TouchableOpacity style={styles.addCurrentBtn} onPress={handleAddCurrentSite}>
                    <Text style={styles.addCurrentBtnText}>Add</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Block Unlisted</Text>
                <Text style={styles.settingHint}>Block injection on unlisted domains</Text>
              </View>
              <Switch
                value={allowlistSettings.blockUnlisted}
                onValueChange={(v) => updateAllowlistSettings({ blockUnlisted: v })}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#ff4757' }}
                thumbColor={allowlistSettings.blockUnlisted ? '#ffffff' : '#888'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Show Blocked Indicator</Text>
                <Text style={styles.settingHint}>Display indicator when blocked</Text>
              </View>
              <Switch
                value={allowlistSettings.showBlockedIndicator}
                onValueChange={(v) => updateAllowlistSettings({ showBlockedIndicator: v })}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#00aaff' }}
                thumbColor={allowlistSettings.showBlockedIndicator ? '#ffffff' : '#888'}
              />
            </View>

            <View style={styles.domainInputRow}>
              <TextInput
                style={styles.domainInput}
                value={domainInput}
                onChangeText={setDomainInput}
                placeholder="Add domain (e.g., example.com)"
                placeholderTextColor="rgba(255,255,255,0.3)"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity style={styles.addButton} onPress={handleAddDomain}>
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>

            {allowlistSettings.domains.length > 0 ? (
              <View style={styles.domainList}>
                {allowlistSettings.domains.map((domain) => (
                  <View key={domain} style={styles.domainItem}>
                    <Text style={styles.domainText}>{domain}</Text>
                    <TouchableOpacity onPress={() => removeAllowlistDomain(domain)}>
                      <Trash2 size={14} color="#ff4757" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No domains in allowlist</Text>
            )}
          </View>
        );

      case 'protected':
        return (
          <View style={styles.settingsGroup}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Body Detection</Text>
                <Text style={styles.settingHint}>Enable ML-based body detection</Text>
              </View>
              <Switch
                value={protectedSettings.bodyDetectionEnabled}
                onValueChange={(v) => updateProtectedSettings({ bodyDetectionEnabled: v })}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#00ff88' }}
                thumbColor={protectedSettings.bodyDetectionEnabled ? '#ffffff' : '#888'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Sensitivity</Text>
              </View>
              <View style={styles.sensitivityButtons}>
                {(['low', 'medium', 'high'] as const).map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.sensitivityBtn,
                      protectedSettings.sensitivityLevel === level && styles.sensitivityBtnActive,
                    ]}
                    onPress={() => updateProtectedSettings({ sensitivityLevel: level })}
                  >
                    <Text style={[
                      styles.sensitivityBtnText,
                      protectedSettings.sensitivityLevel === level && styles.sensitivityBtnTextActive,
                    ]}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Show Protected Badge</Text>
                <Text style={styles.settingHint}>Display protection status overlay</Text>
              </View>
              <Switch
                value={protectedSettings.showProtectedBadge}
                onValueChange={(v) => updateProtectedSettings({ showProtectedBadge: v })}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#00aaff' }}
                thumbColor={protectedSettings.showProtectedBadge ? '#ffffff' : '#888'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Blur Fallback</Text>
                <Text style={styles.settingHint}>Blur if no replacement video</Text>
              </View>
              <Switch
                value={protectedSettings.blurFallback}
                onValueChange={(v) => updateProtectedSettings({ blurFallback: v })}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#ff6b35' }}
                thumbColor={protectedSettings.blurFallback ? '#ffffff' : '#888'}
              />
            </View>

            <TouchableOpacity style={styles.actionButton} onPress={handleOpenProtectedPreview}>
              <Shield size={16} color="#00ff88" />
              <Text style={styles.actionButtonText}>Open Protected Preview</Text>
              <ChevronRight size={16} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </View>
        );

      case 'harness':
        return (
          <View style={styles.settingsGroup}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Overlay Enabled</Text>
                <Text style={styles.settingHint}>Enable video overlay on camera</Text>
              </View>
              <Switch
                value={harnessSettings.overlayEnabled}
                onValueChange={(v) => updateHarnessSettings({ overlayEnabled: v })}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#00ff88' }}
                thumbColor={harnessSettings.overlayEnabled ? '#ffffff' : '#888'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Show Debug Info</Text>
                <Text style={styles.settingHint}>Display FPS, latency, and status</Text>
              </View>
              <Switch
                value={harnessSettings.showDebugInfo}
                onValueChange={(v) => updateHarnessSettings({ showDebugInfo: v })}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#00aaff' }}
                thumbColor={harnessSettings.showDebugInfo ? '#ffffff' : '#888'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Mirror Video</Text>
                <Text style={styles.settingHint}>Flip video horizontally</Text>
              </View>
              <Switch
                value={harnessSettings.mirrorVideo}
                onValueChange={(v) => updateHarnessSettings({ mirrorVideo: v })}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#ff6b35' }}
                thumbColor={harnessSettings.mirrorVideo ? '#ffffff' : '#888'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Test Pattern</Text>
                <Text style={styles.settingHint}>Show test pattern when no video</Text>
              </View>
              <Switch
                value={harnessSettings.testPatternOnNoVideo}
                onValueChange={(v) => updateHarnessSettings({ testPatternOnNoVideo: v })}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#b388ff' }}
                thumbColor={harnessSettings.testPatternOnNoVideo ? '#ffffff' : '#888'}
              />
            </View>

            <TouchableOpacity style={styles.actionButton} onPress={handleOpenTestHarness}>
              <Monitor size={16} color="#00aaff" />
              <Text style={styles.actionButtonText}>Open Test Harness</Text>
              <ChevronRight size={16} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </View>
        );

      case 'claude':
        return (
          <View style={styles.settingsGroup}>
            {/* Section: AI Core Features */}
            <View style={styles.claudeSectionHeader}>
              <Brain size={14} color="#a855f7" />
              <Text style={styles.claudeSectionTitle}>AI Core Features</Text>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Adaptive Quality</Text>
                <Text style={styles.settingHint}>AI optimizes quality based on conditions</Text>
              </View>
              <Switch
                value={claudeSettings.adaptiveQuality}
                onValueChange={(v) => updateClaudeSettings({ adaptiveQuality: v })}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#a855f7' }}
                thumbColor={claudeSettings.adaptiveQuality ? '#ffffff' : '#888'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Neural Fingerprinting</Text>
                <Text style={styles.settingHint}>Generate realistic device fingerprints</Text>
              </View>
              <Switch
                value={claudeSettings.neuralFingerprintEnabled}
                onValueChange={(v) => updateClaudeSettings({ neuralFingerprintEnabled: v })}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#a855f7' }}
                thumbColor={claudeSettings.neuralFingerprintEnabled ? '#ffffff' : '#888'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Temporal Coherence</Text>
                <Text style={styles.settingHint}>Ensure natural frame transitions</Text>
              </View>
              <Switch
                value={claudeSettings.temporalCoherenceEnabled}
                onValueChange={(v) => updateClaudeSettings({ temporalCoherenceEnabled: v })}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#a855f7' }}
                thumbColor={claudeSettings.temporalCoherenceEnabled ? '#ffffff' : '#888'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Motion Prediction</Text>
                <Text style={styles.settingHint}>Predict and smooth motion artifacts</Text>
              </View>
              <Switch
                value={claudeSettings.motionPredictionEnabled}
                onValueChange={(v) => updateClaudeSettings({ motionPredictionEnabled: v })}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#a855f7' }}
                thumbColor={claudeSettings.motionPredictionEnabled ? '#ffffff' : '#888'}
              />
            </View>

            {/* Section: Behavioral Mimicry */}
            <View style={[styles.claudeSectionHeader, { marginTop: 16 }]}>
              <Activity size={14} color="#ec4899" />
              <Text style={styles.claudeSectionTitle}>Behavioral Mimicry</Text>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Behavioral System</Text>
                <Text style={styles.settingHint}>Simulate human interaction patterns</Text>
              </View>
              <Switch
                value={claudeSettings.behavioralMimicryEnabled}
                onValueChange={(v) => updateClaudeSettings({ behavioralMimicryEnabled: v })}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#ec4899' }}
                thumbColor={claudeSettings.behavioralMimicryEnabled ? '#ffffff' : '#888'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Micro Movements</Text>
                <Text style={styles.settingHint}>Add subtle natural movements</Text>
              </View>
              <Switch
                value={claudeSettings.microMovementSimulation}
                onValueChange={(v) => updateClaudeSettings({ microMovementSimulation: v })}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#ec4899' }}
                thumbColor={claudeSettings.microMovementSimulation ? '#ffffff' : '#888'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Blink Synthesis</Text>
                <Text style={styles.settingHint}>Simulate natural blink patterns</Text>
              </View>
              <Switch
                value={claudeSettings.blinkPatternSynthesis}
                onValueChange={(v) => updateClaudeSettings({ blinkPatternSynthesis: v })}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#ec4899' }}
                thumbColor={claudeSettings.blinkPatternSynthesis ? '#ffffff' : '#888'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Breathing Motion</Text>
                <Text style={styles.settingHint}>Simulate subtle breathing movements</Text>
              </View>
              <Switch
                value={claudeSettings.breathingMotionEnabled}
                onValueChange={(v) => updateClaudeSettings({ breathingMotionEnabled: v })}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#ec4899' }}
                thumbColor={claudeSettings.breathingMotionEnabled ? '#ffffff' : '#888'}
              />
            </View>

            {/* Section: Stealth & Anti-Detection */}
            <View style={[styles.claudeSectionHeader, { marginTop: 16 }]}>
              <Fingerprint size={14} color="#f59e0b" />
              <Text style={styles.claudeSectionTitle}>Stealth & Anti-Detection</Text>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Anti-Detection Level</Text>
              </View>
              <View style={styles.claudeLevelButtons}>
                {(['minimal', 'standard', 'maximum', 'paranoid'] as const).map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.claudeLevelBtn,
                      claudeSettings.antiDetectionLevel === level && styles.claudeLevelBtnActive,
                    ]}
                    onPress={() => updateClaudeSettings({ antiDetectionLevel: level })}
                  >
                    <Text style={[
                      styles.claudeLevelBtnText,
                      claudeSettings.antiDetectionLevel === level && styles.claudeLevelBtnTextActive,
                    ]}>
                      {level.charAt(0).toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Dynamic Timing Jitter</Text>
                <Text style={styles.settingHint}>Randomize API response times</Text>
              </View>
              <Switch
                value={claudeSettings.dynamicTimingJitter}
                onValueChange={(v) => updateClaudeSettings({ dynamicTimingJitter: v })}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#f59e0b' }}
                thumbColor={claudeSettings.dynamicTimingJitter ? '#ffffff' : '#888'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Canvas Mutation</Text>
                <Text style={styles.settingHint}>Mutate canvas fingerprints</Text>
              </View>
              <Switch
                value={claudeSettings.canvasFingerprintMutation}
                onValueChange={(v) => updateClaudeSettings({ canvasFingerprintMutation: v })}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#f59e0b' }}
                thumbColor={claudeSettings.canvasFingerprintMutation ? '#ffffff' : '#888'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>WebGL Randomization</Text>
                <Text style={styles.settingHint}>Randomize WebGL signatures</Text>
              </View>
              <Switch
                value={claudeSettings.webglSignatureRandomization}
                onValueChange={(v) => updateClaudeSettings({ webglSignatureRandomization: v })}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#f59e0b' }}
                thumbColor={claudeSettings.webglSignatureRandomization ? '#ffffff' : '#888'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Audio Obfuscation</Text>
                <Text style={styles.settingHint}>Obfuscate audio context fingerprints</Text>
              </View>
              <Switch
                value={claudeSettings.audioContextObfuscation}
                onValueChange={(v) => updateClaudeSettings({ audioContextObfuscation: v })}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#f59e0b' }}
                thumbColor={claudeSettings.audioContextObfuscation ? '#ffffff' : '#888'}
              />
            </View>

            {/* Section: Context-Aware Injection */}
            <View style={[styles.claudeSectionHeader, { marginTop: 16 }]}>
              <Sparkles size={14} color="#06b6d4" />
              <Text style={styles.claudeSectionTitle}>Context-Aware Injection</Text>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Context-Aware System</Text>
                <Text style={styles.settingHint}>Adapt injection to page context</Text>
              </View>
              <Switch
                value={claudeSettings.contextAwareEnabled}
                onValueChange={(v) => updateClaudeSettings({ contextAwareEnabled: v })}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#06b6d4' }}
                thumbColor={claudeSettings.contextAwareEnabled ? '#ffffff' : '#888'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Auto Orientation</Text>
                <Text style={styles.settingHint}>Match device orientation automatically</Text>
              </View>
              <Switch
                value={claudeSettings.automaticOrientationMatching}
                onValueChange={(v) => updateClaudeSettings({ automaticOrientationMatching: v })}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#06b6d4' }}
                thumbColor={claudeSettings.automaticOrientationMatching ? '#ffffff' : '#888'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Lighting Adaptation</Text>
                <Text style={styles.settingHint}>Adapt to lighting conditions</Text>
              </View>
              <Switch
                value={claudeSettings.lightingConditionAdaptation}
                onValueChange={(v) => updateClaudeSettings({ lightingConditionAdaptation: v })}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#06b6d4' }}
                thumbColor={claudeSettings.lightingConditionAdaptation ? '#ffffff' : '#888'}
              />
            </View>

            {/* Section: Performance */}
            <View style={[styles.claudeSectionHeader, { marginTop: 16 }]}>
              <Gauge size={14} color="#22c55e" />
              <Text style={styles.claudeSectionTitle}>Performance</Text>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>GPU Acceleration</Text>
                <Text style={styles.settingHint}>Use GPU for video processing</Text>
              </View>
              <Switch
                value={claudeSettings.gpuAccelerationEnabled}
                onValueChange={(v) => updateClaudeSettings({ gpuAccelerationEnabled: v })}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#22c55e' }}
                thumbColor={claudeSettings.gpuAccelerationEnabled ? '#ffffff' : '#888'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Predictive Prefetching</Text>
                <Text style={styles.settingHint}>Prefetch video frames intelligently</Text>
              </View>
              <Switch
                value={claudeSettings.predictivePrefetching}
                onValueChange={(v) => updateClaudeSettings({ predictivePrefetching: v })}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#22c55e' }}
                thumbColor={claudeSettings.predictivePrefetching ? '#ffffff' : '#888'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Stream Pooling</Text>
                <Text style={styles.settingHint}>Reuse streams for efficiency</Text>
              </View>
              <Switch
                value={claudeSettings.streamPoolingEnabled}
                onValueChange={(v) => updateClaudeSettings({ streamPoolingEnabled: v })}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#22c55e' }}
                thumbColor={claudeSettings.streamPoolingEnabled ? '#ffffff' : '#888'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Memory Optimization</Text>
              </View>
              <View style={styles.sensitivityButtons}>
                {(['low', 'medium', 'high'] as const).map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.sensitivityBtn,
                      claudeSettings.memoryOptimizationLevel === level && styles.claudeMemoryBtnActive,
                    ]}
                    onPress={() => updateClaudeSettings({ memoryOptimizationLevel: level })}
                  >
                    <Text style={[
                      styles.sensitivityBtnText,
                      claudeSettings.memoryOptimizationLevel === level && styles.sensitivityBtnTextActive,
                    ]}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Intelligent Fallback</Text>
                <Text style={styles.settingHint}>Graceful degradation chain</Text>
              </View>
              <Switch
                value={claudeSettings.intelligentFallbackEnabled}
                onValueChange={(v) => updateClaudeSettings({ intelligentFallbackEnabled: v })}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#22c55e' }}
                thumbColor={claudeSettings.intelligentFallbackEnabled ? '#ffffff' : '#888'}
              />
            </View>

            {/* Claude Protocol Badge */}
            <View style={styles.claudeBadge}>
              <Brain size={16} color="#a855f7" />
              <View style={styles.claudeBadgeContent}>
                <Text style={styles.claudeBadgeTitle}>Claude Protocol Active</Text>
                <Text style={styles.claudeBadgeText}>
                  Most advanced AI-driven injection system
                </Text>
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const protocolIcons: Record<ProtocolType, React.ReactNode> = {
    standard: <Zap size={18} color="#00ff88" />,
    allowlist: <Shield size={18} color="#00aaff" />,
    protected: <EyeOff size={18} color="#ff6b35" />,
    harness: <Monitor size={18} color="#b388ff" />,
    claude: <Brain size={18} color="#a855f7" />,
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <FlaskConical size={20} color="#ffcc00" />
              <Text style={styles.title}>Testing Protocols</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Developer Mode Section */}
            <View style={styles.developerSection}>
              <View style={styles.developerHeader}>
                <View style={styles.developerHeaderLeft}>
                  {developerModeEnabled ? (
                    <Unlock size={20} color="#00ff88" />
                  ) : (
                    <Lock size={20} color="#ff4757" />
                  )}
                  <Text style={styles.developerTitle}>Developer Mode</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.developerToggle,
                    developerModeEnabled && styles.developerToggleActive,
                  ]}
                  onPress={handleToggleDeveloperMode}
                >
                  <Text style={[
                    styles.developerToggleText,
                    developerModeEnabled && styles.developerToggleTextActive,
                  ]}>
                    {developerModeEnabled ? 'Enabled' : 'Locked'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.developerHint}>
                {developerModeEnabled
                  ? 'All settings are unlocked. Changes will affect injection behavior.'
                  : 'Enable developer mode with PIN to modify protocol settings and allowlist.'}
              </Text>

              {showPinEntry && (
                <View style={styles.pinEntry}>
                  <TextInput
                    style={styles.pinInput}
                    value={pinInput}
                    onChangeText={setPinInput}
                    placeholder={developerPin ? 'Enter PIN' : 'Set a new PIN'}
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    secureTextEntry
                    autoFocus
                  />
                  <TouchableOpacity style={styles.pinButton} onPress={handlePinSubmit}>
                    <Check size={18} color="#0a0a0a" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.pinCancelButton}
                    onPress={() => {
                      setShowPinEntry(false);
                      setPinInput('');
                    }}
                  >
                    <X size={18} color="#ff4757" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Presentation Mode Section */}
            <View style={styles.presentationSection}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Presentation Mode</Text>
                  <Text style={styles.settingHint}>Optimize UI for demonstrations</Text>
                </View>
                <Switch
                  value={presentationMode}
                  onValueChange={togglePresentationMode}
                  trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#ffcc00' }}
                  thumbColor={presentationMode ? '#ffffff' : '#888'}
                />
              </View>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Testing Watermark</Text>
                  <Text style={styles.settingHint}>Show &quot;Testing Prototype&quot; overlay</Text>
                </View>
                <Switch
                  value={showTestingWatermark}
                  onValueChange={setShowTestingWatermark}
                  trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#ffcc00' }}
                  thumbColor={showTestingWatermark ? '#ffffff' : '#888'}
                />
              </View>
            </View>

            {/* Safety Features */}
            <View style={styles.safetySection}>
              <Text style={styles.sectionTitle}>Safety Features</Text>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <View style={styles.settingLabelRow}>
                    <Lock size={12} color="#00ff88" />
                    <Text style={styles.settingLabel}>HTTPS Enforced</Text>
                  </View>
                  <Text style={styles.settingHint}>Only allow HTTPS connections</Text>
                </View>
                <Switch
                  value={httpsEnforced}
                  onValueChange={setHttpsEnforced}
                  trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#00ff88' }}
                  thumbColor={httpsEnforced ? '#ffffff' : '#888'}
                  disabled={!developerModeEnabled}
                />
              </View>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <View style={styles.settingLabelRow}>
                    <Cpu size={12} color="#00aaff" />
                    <Text style={styles.settingLabel}>ML Safety Mode</Text>
                  </View>
                  <Text style={styles.settingHint}>Enable ML-based content protection</Text>
                </View>
                <Switch
                  value={mlSafetyEnabled}
                  onValueChange={setMlSafetyEnabled}
                  trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#00aaff' }}
                  thumbColor={mlSafetyEnabled ? '#ffffff' : '#888'}
                  disabled={!developerModeEnabled}
                />
              </View>
              <View style={styles.mlNotice}>
                <AlertTriangle size={14} color="#ffcc00" />
                <Text style={styles.mlNoticeText}>
                  In production, ML models will prevent malicious use automatically.
                </Text>
              </View>
            </View>

            {/* Protocol List */}
            <View style={styles.protocolsSection}>
              <Text style={styles.sectionTitle}>Available Protocols</Text>
              
              {(Object.keys(protocols) as ProtocolType[]).map((protocolId) => {
                const protocol = protocols[protocolId];
                const isExpanded = expandedProtocol === protocolId;
                const isActive = activeProtocol === protocolId;

                return (
                  <View
                    key={protocolId}
                    style={[
                      styles.protocolCard,
                      isActive && styles.protocolCardActive,
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.protocolHeader}
                      onPress={() => toggleProtocol(protocolId)}
                    >
                      <View style={styles.protocolHeaderLeft}>
                        {protocolIcons[protocolId]}
                        <View style={styles.protocolInfo}>
                          <Text style={styles.protocolName}>{protocol.name}</Text>
                          <Text style={styles.protocolDescription} numberOfLines={1}>
                            {protocol.description}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.protocolHeaderRight}>
                        {isActive && (
                          <View style={styles.activeBadge}>
                            <Text style={styles.activeBadgeText}>ACTIVE</Text>
                          </View>
                        )}
                        <ChevronRight
                          size={18}
                          color="rgba(255,255,255,0.4)"
                          style={{
                            transform: [{ rotate: isExpanded ? '90deg' : '0deg' }],
                          }}
                        />
                      </View>
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.protocolContent}>
                        <Text style={styles.protocolFullDescription}>
                          {protocol.description}
                        </Text>

                        {!isActive && (
                          <TouchableOpacity
                            style={styles.setActiveButton}
                            onPress={() => setActiveProtocol(protocolId)}
                          >
                            <Check size={14} color="#0a0a0a" />
                            <Text style={styles.setActiveButtonText}>Set as Active</Text>
                          </TouchableOpacity>
                        )}

                        {renderProtocolSettings(protocolId)}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  body: {
    padding: 16,
  },
  developerSection: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  developerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  developerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  developerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  developerToggle: {
    backgroundColor: 'rgba(255, 71, 87, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 71, 87, 0.4)',
  },
  developerToggleActive: {
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    borderColor: 'rgba(0, 255, 136, 0.4)',
  },
  developerToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ff4757',
  },
  developerToggleTextActive: {
    color: '#00ff88',
  },
  developerHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 18,
  },
  pinEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  pinInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 14,
  },
  pinButton: {
    backgroundColor: '#00ff88',
    borderRadius: 10,
    padding: 10,
  },
  pinCancelButton: {
    backgroundColor: 'rgba(255,71,87,0.2)',
    borderRadius: 10,
    padding: 10,
  },
  presentationSection: {
    backgroundColor: 'rgba(255, 204, 0, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 204, 0, 0.2)',
  },
  safetySection: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  settingHint: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  mlNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 204, 0, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  mlNoticeText: {
    flex: 1,
    fontSize: 11,
    color: 'rgba(255, 204, 0, 0.9)',
    lineHeight: 16,
  },
  protocolsSection: {
    marginBottom: 32,
  },
  protocolCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  protocolCardActive: {
    borderColor: 'rgba(0, 255, 136, 0.4)',
    backgroundColor: 'rgba(0, 255, 136, 0.05)',
  },
  protocolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  protocolHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  protocolInfo: {
    flex: 1,
  },
  protocolName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  protocolDescription: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  protocolHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeBadge: {
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  activeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#00ff88',
    letterSpacing: 0.5,
  },
  protocolContent: {
    padding: 14,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  protocolFullDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 18,
    marginBottom: 12,
  },
  setActiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00ff88',
    borderRadius: 10,
    paddingVertical: 10,
    marginBottom: 12,
  },
  setActiveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  settingsGroup: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    padding: 10,
  },
  lockedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  lockedNoticeText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  currentSiteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 170, 255, 0.1)',
    borderRadius: 10,
    padding: 10,
    marginVertical: 8,
  },
  currentSiteText: {
    flex: 1,
    fontSize: 12,
    color: '#ffffff',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusAllowed: {
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
  },
  statusBlocked: {
    backgroundColor: 'rgba(255, 71, 87, 0.2)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  addCurrentBtn: {
    backgroundColor: '#00ff88',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  addCurrentBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  sensitivityButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  sensitivityBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sensitivityBtnActive: {
    backgroundColor: '#ff6b35',
  },
  sensitivityBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  sensitivityBtnTextActive: {
    color: '#ffffff',
  },
  domainInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  domainInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13,
  },
  addButton: {
    backgroundColor: '#00ff88',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  domainList: {
    marginTop: 10,
    gap: 6,
  },
  domainItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  domainText: {
    fontSize: 12,
    color: '#ffffff',
  },
  emptyText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 10,
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0, 170, 255, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#00aaff',
  },
  // Claude Protocol specific styles
  claudeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(168, 85, 247, 0.2)',
  },
  claudeSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a855f7',
    letterSpacing: 0.3,
  },
  claudeLevelButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  claudeLevelBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  claudeLevelBtnActive: {
    backgroundColor: '#f59e0b',
  },
  claudeLevelBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
  },
  claudeLevelBtnTextActive: {
    color: '#ffffff',
  },
  claudeMemoryBtnActive: {
    backgroundColor: '#22c55e',
  },
  claudeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  claudeBadgeContent: {
    flex: 1,
  },
  claudeBadgeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#a855f7',
  },
  claudeBadgeText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
});
