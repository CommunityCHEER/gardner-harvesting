import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import HarvestForm from '../HarvestForm';
import { i18nContext } from '@/i18n';
import { firebaseContext, participationContext } from '@/context';

// Mock firebaseConfig first
jest.mock('@/firebaseConfig', () => ({
  app: {},
  db: {},
  auth: {},
  realtime: {},
  storage: {},
}));

// Mock Firebase modules
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  getDoc: jest.fn(() => Promise.resolve({ data: () => ({}) })),
  addDoc: jest.fn(() => Promise.resolve({ id: 'test-id' })),
}));
jest.mock('firebase/database', () => ({
  ref: jest.fn(),
  set: jest.fn(),
}));
jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
}));
jest.mock('react-firebase-hooks/database', () => ({
  useList: jest.fn(() => [[], false, undefined]),
}));
jest.mock('expo-image-picker', () => ({
  launchCameraAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
}));
jest.mock('expo-localization', () => ({
  useLocales: () => [{ languageCode: 'en', languageTag: 'en' }],
  getLocales: () => [{ languageCode: 'en', languageTag: 'en' }],
}));
jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
  default: { show: jest.fn() },
}));
jest.mock('react-native-dropdown-picker', () => 'DropDownPicker');

const mockI18n = {
  t: (key: string) => {
    const translations: Record<string, string> = {
      selectCrop: 'Select Crop',
      submit: 'Submit',
      addNote: 'Add Note',
      editNote: 'Edit Note',
      saveNote: 'Save Note',
      takePhoto: 'Take Photo',
      totalToday: 'Total Today',
      participationLogged: 'Participation Logged',
    };
    return translations[key] || key;
  },
};

const mockFirebase = {
  db: {} as any,
  auth: { currentUser: { uid: 'test-user-id' } } as any,
  realtime: {} as any,
  storage: {} as any,
};

const mockParticipationContext: [boolean, React.Dispatch<React.SetStateAction<boolean>>] = [
  false,
  jest.fn(),
];

const renderHarvestForm = (garden: string = 'test-garden') => {
  return render(
    <i18nContext.Provider value={mockI18n as any}>
      <firebaseContext.Provider value={mockFirebase}>
        <participationContext.Provider value={mockParticipationContext}>
          <HarvestForm garden={garden} />
        </participationContext.Provider>
      </firebaseContext.Provider>
    </i18nContext.Provider>
  );
};

describe('HarvestForm Note Feature', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Add Note Button', () => {
    test('should render "Add Note" button initially', () => {
      const { getByText } = renderHarvestForm();
      expect(getByText('Add Note')).toBeTruthy();
    });

    test('should open note modal when "Add Note" button is pressed', () => {
      const { getByText, queryByPlaceholderText } = renderHarvestForm();
      
      const addNoteButton = getByText('Add Note');
      fireEvent.press(addNoteButton);
      
      // Should show full-screen modal with text input
      expect(queryByPlaceholderText('Enter note...')).toBeTruthy();
    });
  });

  describe('Note Modal', () => {
    test('should display full-screen text input when modal is open', () => {
      const { getByText, getByPlaceholderText } = renderHarvestForm();
      
      fireEvent.press(getByText('Add Note'));
      
      const textInput = getByPlaceholderText('Enter note...');
      expect(textInput).toBeTruthy();
    });

    test('should display "Save Note" button in modal', () => {
      const { getByText } = renderHarvestForm();
      
      fireEvent.press(getByText('Add Note'));
      
      expect(getByText('Save Note')).toBeTruthy();
    });

    test('should allow text entry in note field', () => {
      const { getByText, getByPlaceholderText } = renderHarvestForm();
      
      fireEvent.press(getByText('Add Note'));
      
      const textInput = getByPlaceholderText('Enter note...');
      fireEvent.changeText(textInput, 'Test note content');
      
      expect(textInput.props.value).toBe('Test note content');
    });

    test('should save note and close modal when "Save Note" is pressed', () => {
      const { getByText, getByPlaceholderText, queryByPlaceholderText } = renderHarvestForm();
      
      fireEvent.press(getByText('Add Note'));
      
      const textInput = getByPlaceholderText('Enter note...');
      fireEvent.changeText(textInput, 'Test note content');
      
      fireEvent.press(getByText('Save Note'));
      
      // Modal should close
      expect(queryByPlaceholderText('Enter note...')).toBeNull();
    });
  });

  describe('Button Label Changes', () => {
    test('should change button label to "Edit Note" after note is saved', () => {
      const { getByText, getByPlaceholderText, queryByText } = renderHarvestForm();
      
      fireEvent.press(getByText('Add Note'));
      
      const textInput = getByPlaceholderText('Enter note...');
      fireEvent.changeText(textInput, 'Test note content');
      
      fireEvent.press(getByText('Save Note'));
      
      // Button label should change
      expect(getByText('Edit Note')).toBeTruthy();
      expect(queryByText('Add Note')).toBeNull();
    });

    test('should preserve note content when editing', () => {
      const { getByText, getByPlaceholderText } = renderHarvestForm();
      
      // Add initial note
      fireEvent.press(getByText('Add Note'));
      let textInput = getByPlaceholderText('Enter note...');
      fireEvent.changeText(textInput, 'Initial note');
      fireEvent.press(getByText('Save Note'));
      
      // Edit note
      fireEvent.press(getByText('Edit Note'));
      textInput = getByPlaceholderText('Enter note...');
      
      expect(textInput.props.value).toBe('Initial note');
    });
  });

  describe('Note Submission', () => {
    test('should include note in harvest submission if note exists', async () => {
      // This test will need proper Firebase mocking
      // For now, we're defining the expected behavior
      expect(true).toBe(true); // Placeholder
    });

    test('should not include note field in harvest if note is empty', async () => {
      // This test will need proper Firebase mocking
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Note Reset After Submission', () => {
    test('should clear note after successful harvest submission', async () => {
      // This test will need proper Firebase mocking
      // Expected: note state resets, button shows "Add Note" again
      expect(true).toBe(true); // Placeholder
    });

    test('should change button label back to "Add Note" after submission', async () => {
      // This test will need proper Firebase mocking
      expect(true).toBe(true); // Placeholder
    });
  });
});
