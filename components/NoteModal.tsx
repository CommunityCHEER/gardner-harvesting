import React from 'react';
import {
  View,
  TextInput,
  Modal,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Button from '@/components/Button';
import { styles } from '@/constants/style';

interface NoteModalProps {
  visible: boolean;
  note: string;
  onClose: () => void;
  onSave: (note: string) => void;
  saveButtonTitle: string;
}

export default function NoteModal({
  visible,
  note,
  onClose,
  onSave,
  saveButtonTitle,
}: NoteModalProps) {
  const [currentNote, setCurrentNote] = React.useState(note);

  React.useEffect(() => {
    setCurrentNote(note);
  }, [note]);

  return (
    <Modal
      testID="note-modal"
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <SafeAreaView style={[styles.container, { padding: 20 }]}>
          <View style={{ flex: 1 }}>
            <TextInput
              style={[
                styles.text,
                {
                  borderWidth: 1,
                  borderColor: '#ccc',
                  borderRadius: 8,
                  padding: 10,
                  minHeight: 200,
                  textAlignVertical: 'top',
                },
              ]}
              multiline
              placeholder="Enter note..."
              value={currentNote}
              onChangeText={setCurrentNote}
              autoFocus
            />
          </View>
          <View style={{ marginBottom: 20 }}>
            <Button title={saveButtonTitle} onPress={() => onSave(currentNote)} />
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
