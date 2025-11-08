import React from 'react';
import { View, Text, Platform } from 'react-native';
import { styles } from '@/constants/style';

export default function VersionDisplay() {
  if (Platform.OS !== 'web') return null;

  const gitHash = process.env.EXPO_PUBLIC_GIT_HASH;
  if (!gitHash) return null;

  return (
    <View style={{ padding: 8, alignItems: 'center' }}>
      <Text style={[styles.text, { fontSize: 12, color: '#888' }]}>
        Release: {gitHash}
      </Text>
    </View>
  );
}
