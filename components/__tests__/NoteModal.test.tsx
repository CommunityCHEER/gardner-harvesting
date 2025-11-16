import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
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
});
