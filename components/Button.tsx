import { Pressable, Text } from 'react-native';

/**
 * A customizable button component.
 *
 * @param {object} props - The component props.
 * @param {string} props.title - The text to display on the button.
 * @param {() => void | Promise<void>} [props.onPress] - The function to call when the button is pressed.
 * @param {number} [props.textSize=20] - The font size of the button title.
 * @param {boolean} [props.disabled] - Whether the button is disabled.
 * @returns {JSX.Element} The rendered button component.
 */
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
