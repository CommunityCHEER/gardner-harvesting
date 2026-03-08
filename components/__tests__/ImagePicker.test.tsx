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

  describe('onSmartHarvest callback', () => {
    const mockOnSmartHarvest = jest.fn();

    it('should call onSmartHarvest with the image after photo is taken', async () => {
      const asset = { uri: 'test-uri', width: 100, height: 100 };
      (ExpoImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        granted: true,
      });
      (ExpoImagePicker.launchCameraAsync as jest.Mock).mockResolvedValueOnce({
        canceled: false,
        assets: [asset],
      });

      const { getByText } = render(
        <ImagePicker
          onImageSelected={mockOnImageSelected}
          onSmartHarvest={mockOnSmartHarvest}
          buttonTitle="Take Photo"
        />
      );

      fireEvent.press(getByText('Take Photo'));

      await waitFor(() => {
        expect(mockOnSmartHarvest).toHaveBeenCalledWith(asset);
      });
    });

    it('should not call onSmartHarvest when camera is canceled', async () => {
      (ExpoImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        granted: true,
      });
      (ExpoImagePicker.launchCameraAsync as jest.Mock).mockResolvedValueOnce({
        canceled: true,
      });

      const { getByText } = render(
        <ImagePicker
          onImageSelected={mockOnImageSelected}
          onSmartHarvest={mockOnSmartHarvest}
          buttonTitle="Take Photo"
        />
      );

      fireEvent.press(getByText('Take Photo'));

      await waitFor(() => {
        expect(mockOnSmartHarvest).not.toHaveBeenCalled();
      });
    });

    it('should not break when onSmartHarvest is not provided', async () => {
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
        expect(mockOnImageSelected).toHaveBeenCalled();
      });
    });
  });

  describe('loading state', () => {
    it('should show ActivityIndicator when identifying is true', () => {
      const { getByTestId } = render(
        <ImagePicker
          onImageSelected={mockOnImageSelected}
          buttonTitle="Take Photo"
          identifying={true}
        />
      );
      expect(getByTestId('smart-harvest-loading')).toBeTruthy();
    });

    it('should not show ActivityIndicator when identifying is false', () => {
      const { queryByTestId } = render(
        <ImagePicker
          onImageSelected={mockOnImageSelected}
          buttonTitle="Take Photo"
          identifying={false}
        />
      );
      expect(queryByTestId('smart-harvest-loading')).toBeNull();
    });

    it('should not show ActivityIndicator by default', () => {
      const { queryByTestId } = render(
        <ImagePicker
          onImageSelected={mockOnImageSelected}
          buttonTitle="Take Photo"
        />
      );
      expect(queryByTestId('smart-harvest-loading')).toBeNull();
    });
  });
});
