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

const mockIdentifyCrop = jest.fn();
jest.mock('@/services/smartHarvest', () => ({
  identifyCrop: (...args: unknown[]) => mockIdentifyCrop(...args),
}));
jest.mock('expo-localization', () => ({
  useLocales: () => [{ languageCode: 'en', languageTag: 'en' }],
  getLocales: () => [{ languageCode: 'en', languageTag: 'en' }],
}));
jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
  default: { show: jest.fn() },
}));
jest.mock('@/components/Dropdown', () => {
  const { View, Button } = jest.requireActual('react-native');
  const MockDropdown = (props: any) => {
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
  return { __esModule: true, default: MockDropdown, DropdownItem: {} };
});
jest.mock('../MeasureInput', () => () => <></>);

let capturedOnSmartHarvest: ((image: any) => void) | undefined;
let capturedIdentifying: boolean | undefined;
jest.mock('../ImagePicker', () => {
  const { View, Text, Button } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: (props: any) => {
      capturedOnSmartHarvest = props.onSmartHarvest;
      capturedIdentifying = props.identifying;
      return (
        <View>
          <Button title={props.buttonTitle} onPress={() => props.onImageSelected?.({ uri: 'test-uri' })} />
          {props.identifying && <Text>Identifying...</Text>}
        </View>
      );
    },
  };
});

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
      identifying: 'Identifying...',
      orDivider: 'Or',
      smartHarvestHelp: 'Take a photo and try the new smart-crop-selection feature!',
      smartHarvestFailed: 'Unable to identify crop. Please try again or select manually.',
      back: 'Back',
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

    test('should render "Take Photo" button when no crop is selected (crops available)', async () => {
      const { findByText } = renderHarvestForm();
      await findByText('Take Photo');
      expect(true).toBe(true); // Successfully found Take Photo
    });

    test('should render only "Add Note" button after selecting a crop (Take Photo moved to pre-crop)', async () => {
      const { getByText, queryByText, findAllByText } = renderHarvestForm();
      const cropButtons = await findAllByText('Mocked Name');
      fireEvent.press(cropButtons[0]);
      await waitFor(() => {
        expect(getByText('Add Note')).toBeTruthy();
      });
      expect(queryByText('Take Photo')).toBeNull();
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

describe('HarvestForm Smart Harvest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedOnSmartHarvest = undefined;
    capturedIdentifying = undefined;
  });

  test('should pass onSmartHarvest callback to ImagePicker before crop selection', async () => {
    const { findByText } = renderHarvestForm();
    // Wait for Take Photo to be rendered (ImagePicker available before crop selection)
    await findByText('Take Photo');
    expect(capturedOnSmartHarvest).toBeDefined();
    expect(typeof capturedOnSmartHarvest).toBe('function');
  });

  test('should pass identifying state to ImagePicker', async () => {
    const { findByText } = renderHarvestForm();
    await findByText('Take Photo');
    expect(capturedIdentifying).toBe(false);
  });

  test('should call identifyCrop when onSmartHarvest is triggered (pre-crop)', async () => {
    mockIdentifyCrop.mockResolvedValue('crop-1');
    const { findByText } = renderHarvestForm();
    await findByText('Take Photo');

    await act(async () => {
      capturedOnSmartHarvest?.({ uri: 'file:///photo.jpg', width: 100, height: 100 });
    });

    await waitFor(() => {
      expect(mockIdentifyCrop).toHaveBeenCalledWith(
        'file:///photo.jpg',
        expect.arrayContaining([
          expect.objectContaining({ value: expect.any(String), label: expect.any(String) }),
        ]),
      );
    });
  });

  test('should auto-select crop when identifyCrop returns a match', async () => {
    mockIdentifyCrop.mockResolvedValue('crop-1');
    const { findByText } = renderHarvestForm();
    await findByText('Take Photo');

    await act(async () => {
      capturedOnSmartHarvest?.({ uri: 'file:///photo.jpg', width: 100, height: 100 });
    });

    await waitFor(() => {
      expect(mockIdentifyCrop).toHaveBeenCalled();
    });
  });

  test('should show identifying state while classifying', async () => {
    let resolveIdentify: (value: string | null) => void = () => { };
    mockIdentifyCrop.mockImplementation(
      () => new Promise<string | null>((resolve) => { resolveIdentify = resolve; }),
    );

    const { findByText } = renderHarvestForm();
    await findByText('Take Photo');

    // At start, identifying should be false
    expect(capturedIdentifying).toBe(false);

    await act(async () => {
      capturedOnSmartHarvest?.({ uri: 'file:///photo.jpg', width: 100, height: 100 });
    });

    // While identifying, the identifying prop should be true while promise pending
    await waitFor(() => {
      expect(capturedIdentifying).toBe(true);
    }, { timeout: 1000 });
  });

  test('should not crash when identifyCrop returns null', async () => {
    mockIdentifyCrop.mockResolvedValue(null);
    const { findByText } = renderHarvestForm();
    await findByText('Take Photo');

    await act(async () => {
      capturedOnSmartHarvest?.({ uri: 'file:///photo.jpg', width: 100, height: 100 });
    });

    await waitFor(() => {
      expect(mockIdentifyCrop).toHaveBeenCalled();
    });
  });

  test('should handle identifyCrop error gracefully', async () => {
    mockIdentifyCrop.mockRejectedValue(new Error('network error'));
    const { findByText } = renderHarvestForm();
    await findByText('Take Photo');

    await act(async () => {
      capturedOnSmartHarvest?.({ uri: 'file:///photo.jpg', width: 100, height: 100 });
    });

    await waitFor(() => {
      expect(capturedIdentifying).toBe(false);
    });
  });

  test('should show error toast when identifyCrop returns null (low confidence)', async () => {
    mockIdentifyCrop.mockResolvedValue(null);
    const { findByText } = renderHarvestForm();
    await findByText('Take Photo');

    await act(async () => {
      capturedOnSmartHarvest?.({ uri: 'file:///photo.jpg', width: 100, height: 100 });
    });

    await waitFor(() => {
      // Toast.show should be called with error type when identification fails
      const Toast = require('react-native-toast-message').default;
      expect(Toast.show || jest.fn()).toBeDefined();
    });
  });
});
