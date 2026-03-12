import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { KeyboardAvoidingView, Platform } from 'react-native';
import NoteModal from '../NoteModal';

describe('NoteModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  it('should render correctly when visible', () => {
    const { getByPlaceholderText, getByText } = render(
      <NoteModal
        visible={true}
        note="Initial note"
        onClose={mockOnClose}
        onSave={mockOnSave}
        saveButtonTitle="Save"
      />
    );
    expect(getByPlaceholderText('Enter note...')).toBeTruthy();
    expect(getByText('Save')).toBeTruthy();
  });

  it('should not render when not visible', () => {
    const { queryByText } = render(
      <NoteModal
        visible={false}
        note=""
        onClose={mockOnClose}
        onSave={mockOnSave}
        saveButtonTitle="Save"
      />
    );
    expect(queryByText('Save')).toBeNull();
  });

  it('should call onSave with the updated note text', () => {
    const { getByPlaceholderText, getByText } = render(
      <NoteModal
        visible={true}
        note="Initial note"
        onClose={mockOnClose}
        onSave={mockOnSave}
        saveButtonTitle="Save"
      />
    );

    fireEvent.changeText(getByPlaceholderText('Enter note...'), 'Updated note');
    fireEvent.press(getByText('Save'));
    expect(mockOnSave).toHaveBeenCalledWith('Updated note');
  });

  it('should use platform keyboard avoiding behavior with zero vertical offset', () => {
    const { UNSAFE_getByType } = render(
      <NoteModal
        visible={true}
        note="Initial note"
        onClose={mockOnClose}
        onSave={mockOnSave}
        saveButtonTitle="Save"
      />
    );

    const keyboardAvoidingView = UNSAFE_getByType(KeyboardAvoidingView);

    expect(keyboardAvoidingView.props.behavior).toBe(
      Platform.OS === 'ios' ? 'padding' : 'height'
    );
    expect(keyboardAvoidingView.props.keyboardVerticalOffset).toBe(0);
  });

  it('should save on a single tap while note input is focused', () => {
    const { getByPlaceholderText, getByText } = render(
      <NoteModal
        visible={true}
        note="Initial note"
        onClose={mockOnClose}
        onSave={mockOnSave}
        saveButtonTitle="Save"
      />
    );

    const noteInput = getByPlaceholderText('Enter note...');
    fireEvent.changeText(noteInput, 'Focused note');
    fireEvent(noteInput, 'focus');

    fireEvent.press(getByText('Save'));
    expect(mockOnSave).toHaveBeenCalledWith('Focused note');
  });
});
