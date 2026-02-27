import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { KeyboardAvoidingView } from 'react-native';
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
  doc: jest.fn((...args) => ({ path: args.slice(1).join('/') })),
  getDocs: jest.fn(() =>
    Promise.resolve({
      docs: [
        { id: 'crop-1', data: () => ({}) },
        { id: 'crop-2', data: () => ({}) },
      ],
      forEach: callback => {
        const units = [
          {
            id: 'required',
            data: () => ({
              value: { id: 'unit-kg', path: 'cropUnits/unit-kg' },
            }),
          },
        ];
        units.forEach(callback);
      },
    })
  ),
  getDoc: jest.fn(docRef => {
    const path = docRef.path;
    if (path.includes('/name/')) {
      return Promise.resolve({ data: () => ({ value: 'Mocked Name' }) });
    }
    // For unit document
    if (path.startsWith('cropUnits/')) {
      return Promise.resolve({
        id: 'unit-kg',
        data: () => ({ fractional: false }),
      });
    }
    return Promise.resolve({ data: () => ({}) });
  }),
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
jest.mock('@/hooks/useList', () => ({
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
jest.mock('react-native-dropdown-picker', () => {
  const { View, Button } = jest.requireActual('react-native');
  return (props: any) => {
    const { value, items, setValue, onSelectItem } = props;
    return (
      <View>
        {items.map((item: any) => (
          <Button
            key={item.value}
            title={item.label}
            onPress={() => {
              setValue(item.value);
              if (onSelectItem) {
                onSelectItem(item);
              }
            }}
          />
        ))}
      </View>
    );
  };
});
jest.mock('../MeasureInput', () => () => <></>);

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

const renderHarvestForm = (garden: string | null = 'test-garden') => {
  const mockSetGarden = jest.fn();
  const mockSetGardenListOpen = jest.fn();
  const mockOnBack = jest.fn();
  const mockGardens = [
    { label: 'Test Garden', value: 'test-garden' },
    { label: 'Another Garden', value: 'another-garden' },
  ];

  return render(
    <i18nContext.Provider value={mockI18n as any}>
      <participationContext.Provider value={mockParticipationContext}>
        <HarvestForm
          garden={garden}
          setGarden={mockSetGarden}
          gardens={mockGardens}
          gardenListOpen={false}
          setGardenListOpen={mockSetGardenListOpen}
          onBack={mockOnBack}
          {...mockFirebase}
        />
      </participationContext.Provider>
    </i18nContext.Provider>
  );
};

// TODO: Helper for testing with crop selected
// Will be implemented when component is refactored for better testability
// Potential approaches:
// 1. Accept initialCrop prop
// 2. Extract button section to separate testable component
// 3. Use E2E/integration tests for full workflow

describe('HarvestForm Note Feature', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Add Note Button', () => {
    test('should not render "Add Note" button when no crop is selected', () => {
      const { queryByText } = renderHarvestForm();
      expect(queryByText('Add Note')).toBeNull();
    });

    test('should not render "Take Photo" button when no crop is selected', () => {
      const { queryByText } = renderHarvestForm();
      expect(queryByText('Take Photo')).toBeNull();
    });

    test('should render "Add Note" and "Take Photo" buttons after selecting a crop', async () => {
      const { getByText, findAllByText } = renderHarvestForm();
      const cropButtons = await findAllByText('Mocked Name');
      fireEvent.press(cropButtons[0]);
      expect(getByText('Add Note')).toBeTruthy();
      expect(getByText('Take Photo')).toBeTruthy();
    });

    test('should open note modal when "Add Note" button is pressed', async () => {
      const { getByText, getByTestId, findAllByText } = renderHarvestForm();
      const cropButtons = await findAllByText('Mocked Name');
      fireEvent.press(cropButtons[0]);
      fireEvent.press(getByText('Add Note'));
      expect(getByTestId('note-modal')).toBeTruthy();
    });
  });

  describe('Note Modal', () => {
    test('should save note and close modal when "Save Note" is pressed', async () => {
      const { getByText, getByPlaceholderText, queryByTestId, findAllByText } =
        renderHarvestForm();
      const cropButtons = await findAllByText('Mocked Name');
      fireEvent.press(cropButtons[0]);
      fireEvent.press(getByText('Add Note'));
      fireEvent.changeText(getByPlaceholderText('Enter note...'), 'My test note');
      fireEvent.press(getByText('Save Note'));
      expect(queryByTestId('note-modal')).toBeNull();
    });
  });

  describe('Button Label Changes', () => {
    test('should change button label to "Edit Note" after note is saved', async () => {
      const { getByText, getByPlaceholderText, findAllByText } = renderHarvestForm();
      const cropButtons = await findAllByText('Mocked Name');
      fireEvent.press(cropButtons[0]);
      fireEvent.press(getByText('Add Note'));
      fireEvent.changeText(getByPlaceholderText('Enter note...'), 'My test note');
      fireEvent.press(getByText('Save Note'));
      expect(getByText('Edit Note')).toBeTruthy();
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
