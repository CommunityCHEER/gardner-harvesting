import React from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

const logoSource = require('../assets/images/favicon.png');

interface ScreenLogoProps {
  size?: number;
  top?: number;
  left?: number;
  style?: StyleProp<ImageStyle>;
}

export default function ScreenLogo({
  size = 66,
  top = 0,
  left = 8,
  style,
}: ScreenLogoProps) {
  const insets = React.useContext(SafeAreaInsetsContext);
  const logoTop = Math.max((insets?.top ?? 0) + top, 0);

  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.container]}
      testID="screen-logo"
    >
      <Image
        source={logoSource}
        accessibilityLabel="App logo"
        style={[
          styles.logo,
          {
            width: size,
            height: size,
            top: logoTop,
            left,
          },
          style,
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 20,
    elevation: 20,
  },
  logo: {
    position: 'absolute',
  },
});