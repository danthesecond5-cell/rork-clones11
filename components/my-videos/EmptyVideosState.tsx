import React from 'react';
import { View, Text } from 'react-native';
import { Film, Search, Download, Upload } from 'lucide-react-native';
import { styles } from './styles';

interface EmptyVideosStateProps {
  searchQuery: string;
}

export const EmptyVideosState = React.memo(function EmptyVideosState({
  searchQuery,
}: EmptyVideosStateProps) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        {searchQuery ? (
          <Search size={48} color="rgba(255,255,255,0.2)" />
        ) : (
          <Film size={48} color="rgba(255,255,255,0.2)" />
        )}
      </View>
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'No Results' : 'No Videos Saved'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery 
          ? `No videos matching "${searchQuery}"`
          : 'Use the import tools above to add videos'
        }
      </Text>
      
      {!searchQuery && (
        <>
          <View style={styles.emptyHints}>
            <View style={styles.hintItem}>
              <Download size={16} color="#00aaff" />
              <Text style={styles.hintText}>Paste a direct video URL (.mp4, .mov)</Text>
            </View>
            <View style={styles.hintItem}>
              <Upload size={16} color="#00ff88" />
              <Text style={styles.hintText}>Upload from Photos or Files app</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
});
