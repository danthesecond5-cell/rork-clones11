import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import {
  Camera,
  Smartphone,
  ChevronRight,
  Info,
  FolderOpen,
} from 'lucide-react-native';
import type { DeviceTemplate, CaptureDevice } from '@/types/device';
import DeviceCard from './DeviceCard';
import {
  TemplateInfoModal,
  CameraInfoModal,
} from './modals';

interface DevicesListProps {
  activeTemplate: DeviceTemplate | null;
  stealthMode: boolean;
  onStealthModeToggle: () => void;
  onTemplateHeaderPress: () => void;
  onDeviceCheckPress: () => void;
  onOpenMyVideos?: () => void;
  onToggleDeviceSimulation: (deviceId: string) => void;
  onClearDeviceVideo: (deviceId: string) => void;
}

export default function DevicesList({
  activeTemplate,
  stealthMode,
  onStealthModeToggle,
  onTemplateHeaderPress,
  onDeviceCheckPress,
  onOpenMyVideos,
  onToggleDeviceSimulation,
  onClearDeviceVideo,
}: DevicesListProps) {
  const [showTemplateInfo, setShowTemplateInfo] = useState(false);
  const [selectedCameraInfo, setSelectedCameraInfo] = useState<CaptureDevice | null>(null);
  const handleOpenMyVideos = useCallback(() => {
    if (onOpenMyVideos) {
      onOpenMyVideos();
      return;
    }
    router.push('/my-videos');
  }, [onOpenMyVideos]);


  if (!activeTemplate) {
    return (
      <View style={styles.noTemplateCard}>
        <Smartphone size={32} color="rgba(255,255,255,0.3)" />
        <Text style={styles.noTemplateText}>No device template selected</Text>
        <TouchableOpacity style={styles.setupBtn} onPress={onDeviceCheckPress}>
          <Text style={styles.setupBtnText}>Run Camera Check</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const backCameras = activeTemplate.captureDevices.filter(d => d.facing === 'back');
  const frontCameras = activeTemplate.captureDevices.filter(d => d.facing === 'front');

  return (
    <ScrollView 
      style={styles.devicesList} 
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
    >
      <TouchableOpacity style={styles.templateHeader} onPress={onTemplateHeaderPress}>
        <View style={styles.templateHeaderInfo}>
          <Text style={styles.templateHeaderName}>{activeTemplate.name}</Text>
          <Text style={styles.templateHeaderMeta}>
            {activeTemplate.captureDevices.length} cameras ({backCameras.length} rear, {frontCameras.length} front)
          </Text>
        </View>
        <TouchableOpacity style={styles.templateInfoBtn} onPress={() => setShowTemplateInfo(true)}>
          <Info size={16} color="#00aaff" />
        </TouchableOpacity>
        <ChevronRight size={18} color="rgba(255,255,255,0.5)" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.permissionToggle, stealthMode && styles.stealthToggleActive]}
        onPress={onStealthModeToggle}
      >
        <View style={styles.permissionIcon}>
          <Camera size={16} color={stealthMode ? '#0a0a0a' : '#ff6b35'} />
        </View>
        <View style={styles.permissionTextContainer}>
          <Text style={[styles.permissionLabel, stealthMode && styles.stealthLabelActive]}>Stealth Mode</Text>
          <Text style={[styles.permissionHint, stealthMode && styles.stealthHintActive]}>
            {stealthMode ? 'Only simulated feeds accessible' : 'Real cameras accessible'}
          </Text>
        </View>
        <View style={[styles.toggleIndicator, stealthMode && styles.stealthIndicatorActive]} />
      </TouchableOpacity>

      <View style={styles.videoLibraryCard}>
        <View style={styles.videoLibraryInfo}>
          <View style={styles.videoLibraryIcon}>
            <FolderOpen size={16} color="#00ff88" />
          </View>
          <View style={styles.videoLibraryText}>
            <Text style={styles.videoLibraryTitle}>My Videos Library</Text>
            <Text style={styles.videoLibrarySubtitle}>
              Import videos and run compatibility checks before assigning.
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.videoLibraryButton} onPress={handleOpenMyVideos}>
          <Text style={styles.videoLibraryButtonText}>Open My Videos</Text>
        </TouchableOpacity>
      </View>

      {activeTemplate.captureDevices.map((device) => (
        <DeviceCard
          key={device.id}
          device={device}
          onToggleSimulation={() => onToggleDeviceSimulation(device.id)}
          onClearVideo={() => onClearDeviceVideo(device.id)}
          onShowInfo={() => setSelectedCameraInfo(device)}
        />
      ))}

      <TemplateInfoModal
        visible={showTemplateInfo}
        template={activeTemplate}
        onClose={() => setShowTemplateInfo(false)}
      />

      <CameraInfoModal
        visible={selectedCameraInfo !== null}
        camera={selectedCameraInfo}
        onClose={() => setSelectedCameraInfo(null)}
      />

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  devicesList: {
    maxHeight: 380,
  },
  noTemplateCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 24,
    gap: 12,
  },
  noTemplateText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  setupBtn: {
    backgroundColor: '#00ff88',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  setupBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#0a0a0a',
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,255,136,0.08)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.2)',
  },
  templateHeaderInfo: {
    flex: 1,
  },
  templateHeaderName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  templateHeaderMeta: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  templateInfoBtn: {
    padding: 8,
    marginRight: 4,
  },
  permissionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.2)',
    marginBottom: 12,
  },
  permissionIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  permissionTextContainer: {
    flex: 1,
  },
  permissionLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  permissionHint: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 1,
  },
  toggleIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: 'rgba(0, 255, 136, 0.5)',
  },
  stealthToggleActive: {
    backgroundColor: '#ff6b35',
    borderColor: '#ff6b35',
  },
  stealthLabelActive: {
    color: '#0a0a0a',
  },
  stealthHintActive: {
    color: 'rgba(0,0,0,0.6)',
  },
  stealthIndicatorActive: {
    backgroundColor: '#0a0a0a',
    borderColor: '#0a0a0a',
  },
  videoLibraryCard: {
    backgroundColor: 'rgba(0,255,136,0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.25)',
  },
  videoLibraryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  videoLibraryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,255,136,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoLibraryText: {
    flex: 1,
  },
  videoLibraryTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  videoLibrarySubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  videoLibraryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,170,255,0.1)',
    borderRadius: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,170,255,0.3)',
  },
  videoLibraryButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#00aaff',
  },
});
