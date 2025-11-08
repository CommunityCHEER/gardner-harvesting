import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import PasswordInput from '../PasswordInput';

describe('PasswordInput', () => {
  it('renders correctly', () => {
    const { getByPlaceholderText } = render(
      <PasswordInput placeholder="Password" />
    );
    expect(getByPlaceholderText('Password')).toBeTruthy();
  });

  it('renders with secureTextEntry enabled by default', () => {
    const { getByPlaceholderText } = render(
      <PasswordInput placeholder="Password" />
    );
    const input = getByPlaceholderText('Password');
    expect(input.props.secureTextEntry).toBe(true);
  });

  it('renders visibility toggle button', () => {
    const { getByTestId } = render(
      <PasswordInput placeholder="Password" testID="password-input" />
    );
    expect(getByTestId('password-toggle-button')).toBeTruthy();
  });

  it('toggles password visibility when toggle button is pressed', () => {
    const { getByPlaceholderText, getByTestId } = render(
      <PasswordInput placeholder="Password" />
    );
    const input = getByPlaceholderText('Password');
    const toggleButton = getByTestId('password-toggle-button');

    // Initially secure
    expect(input.props.secureTextEntry).toBe(true);

    // Toggle to visible
    fireEvent.press(toggleButton);
    expect(input.props.secureTextEntry).toBe(false);

    // Toggle back to secure
    fireEvent.press(toggleButton);
    expect(input.props.secureTextEntry).toBe(true);
  });

  it('accepts and calls onChangeText callback', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <PasswordInput placeholder="Password" onChangeText={onChangeText} />
    );
    const input = getByPlaceholderText('Password');

    fireEvent.changeText(input, 'testpassword');
    expect(onChangeText).toHaveBeenCalledWith('testpassword');
  });

  it('accepts value prop', () => {
    const { getByPlaceholderText } = render(
      <PasswordInput placeholder="Password" value="initialValue" />
    );
    const input = getByPlaceholderText('Password');
    expect(input.props.value).toBe('initialValue');
  });

  it('passes through other TextInput props', () => {
    const { getByPlaceholderText } = render(
      <PasswordInput
        placeholder="Password"
        autoCapitalize="none"
        autoCorrect={false}
      />
    );
    const input = getByPlaceholderText('Password');
    expect(input.props.autoCapitalize).toBe('none');
    expect(input.props.autoCorrect).toBe(false);
  });
});
