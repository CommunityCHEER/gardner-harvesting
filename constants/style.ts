import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  dropdown: { width: 250, alignSelf: 'center', margin: 8 },

  input: {
    width: 80,
    margin: 8,
    borderWidth: 1,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    fontSize: 20,
  },

  text: {
    fontSize: 20,
  },

  image: { width: 280, height: 200 },
});
