import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  Camera,
  FileVideo,
  Trash2,
  Info,
} from 'lucide-react-native';
import type { CaptureDevice } from '@/types/device';

interface DeviceCardProps {
  device: CaptureDevice;
  onToggleSimulation: () => void;
  onClearVideo: () => void;
  onShowInfo: () => void;
}

export default function DeviceCard({
  device,
  onToggleSimulation,
  onClearVideo,
  onShowInfo,
}: DeviceCardProps) {
  return (
    <View style={styles.deviceCard}>
      <View style={styles.deviceCardHeader}>
        <View style={styles.deviceIconSmall}>
          <Camera size={18} color="#00ff88" />
        </View>
        <View style={styles.deviceCardInfo}>
          <Text style={styles.deviceCardName}>{device.name}</Text>
          <View style={styles.deviceCardMeta}>
            {device.zoomFactor && <Text style={styles.deviceCardMetaText}>{device.zoomFactor}</Text>}
            {device.hardwareInfo?.megapixels && <Text style={styles.deviceCardMetaText}>{device.hardwareInfo.megapixels}MP</Text>}
            {device.lensType && device.lensType !== 'wide' && <Text style={styles.deviceCardMetaText}>{device.lensType}</Text>}
          </View>
        </View>
        <TouchableOpacity style={styles.infoBtn} onPress={onShowInfo}>
          <Info size={16} color="#00aaff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.simToggle,
            device.simulationEnabled && styles.simToggleActive,
            !device.assignedVideoUri && styles.simToggleDisabled,
          ]}
          onPress={onToggleSimulation}
          disabled={!device.assignedVideoUri}
        >
          <Text style={[
            styles.simToggleText,
            device.simulationEnabled && styles.simToggleTextActive,
            !device.assignedVideoUri && styles.simToggleTextDisabled,
          ]}>
            {device.simulationEnabled ? 'SIM' : 'LIVE'}
          </Text>
        </TouchableOpacity>
      </View>

      {device.assignedVideoUri ? (
        <View style={styles.assignedVideoInfo}>
          <FileVideo size={14} color="#00ff88" />
          <Text style={styles.assignedVideoName} numberOfLines={1}>
            {device.assignedVideoName}
          </Text>
          <TouchableOpacity
            style={styles.clearVideoBtn}
            onPress={onClearVideo}
          >
            <Trash2 size={14} color="#ff4757" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.videoAssignSection}>
          <Text style={styles.noVideoHint}>
            Assign a compatible video from the toolbar below.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  deviceCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  deviceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceIconSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,255,136,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceCardInfo: {
    flex: 1,
    marginLeft: 10,
  },
  deviceCardName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  deviceCardMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  deviceCardMetaText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
  },
  infoBtn: {
    padding: 8,
    marginRight: 4,
  },
  simToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  simToggleActive: {
    backgroundColor: '#ff6b35',
  },
  simToggleDisabled: {
    opacity: 0.4,
  },
  simToggleText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  simToggleTextActive: {
    color: '#ffffff',
  },
  simToggleTextDisabled: {
    color: 'rgba(255,255,255,0.5)',
  },
  assignedVideoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,255,136,0.08)',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    gap: 8,
  },
  assignedVideoName: {
    flex: 1,
    fontSize: 12,
    color: '#00ff88',
  },
  clearVideoBtn: {
    padding: 4,
  },
  videoAssignSection: {
    marginTop: 10,
  },
  noVideoHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center' as const,
    paddingVertical: 8,
  },
});
