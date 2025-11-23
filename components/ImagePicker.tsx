import React, { useState } from 'react';
import { View, Image, Keyboard } from 'react-native';
import Button from '@/components/Button';
import {
  ImagePickerAsset,
  launchCameraAsync,
  requestCameraPermissionsAsync,
} from 'expo-image-picker';

interface ImagePickerProps {
  onImageSelected: (image: ImagePickerAsset) => void;
  buttonTitle: string;
}

export default function ImagePicker({
  onImageSelected,
  buttonTitle,
}: ImagePickerProps) {
  const [image, setImage] = useState<ImagePickerAsset>();

  const takePhoto = async () => {
    Keyboard.dismiss();
    const permissions = await requestCameraPermissionsAsync();
    if (!permissions.granted) return;
    const result = await launchCameraAsync();
    if (result.canceled) return;
    setImage(result.assets[0]);
    onImageSelected(result.assets[0]);
  };

  return (
    <View style={{ alignItems: 'center' }}>
      <Button title={buttonTitle} onPress={takePhoto} />
      {image && (
        <Image
          src={image.uri}
          style={{
            aspectRatio: image.width / image.height,
            height: Math.min(image.height / 60, 75),
          }}
        />
      )}
    </View>
  );
}
