import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Props for the PasswordInput component.
 * @interface PasswordInputProps
 * @extends {TextInputProps}
 * @property {any} [style] - Custom styles to apply to the text input.
 */
interface PasswordInputProps extends TextInputProps {
  style?: any;
}

/**
 * A text input component for entering passwords, with a button to toggle visibility.
 * @param {PasswordInputProps} props - The component props.
 * @returns {JSX.Element} The rendered component.
 */
export default function PasswordInput({
  style,
  ...props
}: PasswordInputProps) {
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  const togglePasswordVisibility = () => {
    setSecureTextEntry(!secureTextEntry);
  };

  return (
    <View style={styles.container}>
      <TextInput
        {...props}
        style={[styles.input, style]}
        secureTextEntry={secureTextEntry}
      />
      <TouchableOpacity
        style={styles.iconButton}
        onPress={togglePasswordVisibility}
        testID="password-toggle-button"
        accessible={true}
        accessibilityLabel={
          secureTextEntry ? 'Show password' : 'Hide password'
        }
      >
        <Ionicons
          name={secureTextEntry ? 'eye-outline' : 'eye-off-outline'}
          size={24}
          color="#666"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  input: {
    flex: 1,
    paddingRight: 40, // Make room for the icon
  },
  iconButton: {
    position: 'absolute',
    right: 10,
    padding: 5,
  },
});
