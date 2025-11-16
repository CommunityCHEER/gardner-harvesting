/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#5bb974';
const tintColorDark = '#fff';

/**
 * An object containing color schemes for light and dark modes.
 * @property {object} light - The light mode color scheme.
 * @property {string} light.text - The text color.
 * @property {string} light.background - The background color.
 * @property {string} light.tint - The tint color.
 * @property {string} light.icon - The icon color.
 * @property {string} light.tabIconDefault - The default tab icon color.
 * @property {string} light.tabIconSelected - The selected tab icon color.
 * @property {object} dark - The dark mode color scheme.
 * @property {string} dark.text - The text color.
 * @property {string} dark.background - The background color.
 * @property {string} dark.tint - The tint color.
 * @property {string} dark.icon - The icon color.
 * @property {string} dark.tabIconDefault - The default tab icon color.
 * @property {string} dark.tabIconSelected - The selected tab icon color.
 */
export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};
