import React from 'react';
import { View } from 'react-native';
import Button from '@/components/Button';
import NoteModal from './NoteModal';
import useStore from '../store';
import { i18nContext } from '@/i18n';

export default function NoteTaker() {
  const { note, setNote, noteModalVisible, setNoteModalVisible } = useStore();
  const i18n = React.useContext(i18nContext);
  const t = i18n.t.bind(i18n);

  return (
    <View>
      <NoteModal
        visible={noteModalVisible}
        note={note}
        onClose={() => setNoteModalVisible(false)}
        onSave={(newNote) => {
          setNote(newNote);
          setNoteModalVisible(false);
        }}
        saveButtonTitle={t('saveNote')}
      />
      <Button
        title={note ? t('editNote') : t('addNote')}
        onPress={() => {
          setNoteModalVisible(true);
        }}
      />
    </View>
  );
}
