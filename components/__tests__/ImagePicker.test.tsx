import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ImagePicker from '../ImagePicker';
import * as ExpoImagePicker from 'expo-image-picker';

jest.mock('expo-image-picker', () => ({
  launchCameraAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
}));

describe('ImagePicker', () => {
  const mockOnImageSelected = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the button correctly', () => {
    const { getByText } = render(
      <ImagePicker
        onImageSelected={mockOnImageSelected}
        buttonTitle="Take Photo"
      />
    );
    expect(getByText('Take Photo')).toBeTruthy();
  });

  it('should call launchCameraAsync when the button is pressed and permissions are granted', async () => {
    (ExpoImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      granted: true,
    });
    (ExpoImagePicker.launchCameraAsync as jest.Mock).mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'test-uri', width: 100, height: 100 }],
    });

    const { getByText } = render(
      <ImagePicker
        onImageSelected={mockOnImageSelected}
        buttonTitle="Take Photo"
      />
    );

    fireEvent.press(getByText('Take Photo'));

    await waitFor(() => {
      expect(ExpoImagePicker.launchCameraAsync).toHaveBeenCalled();
      expect(mockOnImageSelected).toHaveBeenCalledWith({
        uri: 'test-uri',
        width: 100,
        height: 100,
      });
    });
  });

  it('should not call launchCameraAsync when permissions are not granted', async () => {
    (ExpoImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      granted: false,
    });

    const { getByText } = render(
      <ImagePicker
        onImageSelected={mockOnImageSelected}
        buttonTitle="Take Photo"
      />
    );

    fireEvent.press(getByText('Take Photo'));

    await waitFor(() => {
      expect(ExpoImagePicker.launchCameraAsync).not.toHaveBeenCalled();
    });
  });
});
