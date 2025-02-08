import { Pressable, Text } from 'react-native';

export default function Button({
  title,
  onPress,
  textSize = 20,
  disabled,
}: {
  title: string;
  onPress?: () => void | Promise<void>;
  textSize?: number;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: disabled ? '#CCCCCC' : '#5bb974',
        borderRadius: 4,
        padding: 8,
        margin: 4,
      }}
      disabled={disabled}
    >
      <Text style={{ fontSize: textSize, color: 'white' }}>{title}</Text>
    </Pressable>
  );
}
