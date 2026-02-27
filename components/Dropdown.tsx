import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';

export interface DropdownItem {
  label: string;
  value: string;
}

export interface DropdownProps {
  placeholder?: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  value: string | null;
  setValue: (value: string) => void;
  items: DropdownItem[];
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  searchable?: boolean;
  searchPlaceholder?: string;
  onPress?: () => void;
}

export default function Dropdown({
  placeholder = 'Select...',
  open,
  setOpen,
  value,
  setValue,
  items,
  style,
  textStyle,
  searchable = false,
  searchPlaceholder = 'Search...',
  onPress,
}: DropdownProps) {
  const [search, setSearch] = useState('');

  const selectedLabel = useMemo(
    () => items.find(item => item.value === value)?.label,
    [items, value]
  );

  const filteredItems = useMemo(() => {
    if (!searchable || !search) return items;
    return items.filter(item =>
      item.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search, searchable]);

  const handlePress = () => {
    onPress?.();
    setOpen(true);
  };

  const handleSelect = (itemValue: string) => {
    setValue(itemValue);
    setOpen(false);
    setSearch('');
  };

  return (
    <>
      <TouchableOpacity
        style={[defaultStyles.trigger, style]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Text style={[defaultStyles.triggerText, textStyle]}>
          {selectedLabel ?? placeholder}
        </Text>
        <Text style={defaultStyles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide">
        <View style={defaultStyles.overlay}>
          <View style={defaultStyles.modal}>
            <TouchableOpacity
              testID="dropdown-close"
              style={defaultStyles.closeButton}
              onPress={() => {
                setOpen(false);
                setSearch('');
              }}
            >
              <Text style={defaultStyles.closeText}>✕</Text>
            </TouchableOpacity>

            {searchable && (
              <TextInput
                style={defaultStyles.searchInput}
                placeholder={searchPlaceholder}
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
              />
            )}

            <FlatList
              data={filteredItems}
              keyExtractor={item => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    defaultStyles.item,
                    item.value === value && defaultStyles.selectedItem,
                  ]}
                  onPress={() => handleSelect(item.value)}
                >
                  <Text
                    style={[
                      defaultStyles.itemText,
                      textStyle,
                      item.value === value && defaultStyles.selectedItemText,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const defaultStyles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
  },
  triggerText: {
    fontSize: 16,
    flex: 1,
  },
  arrow: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 12,
    maxHeight: '80%',
    padding: 16,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 4,
  },
  closeText: {
    fontSize: 20,
    color: '#666',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    fontSize: 16,
  },
  item: {
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  selectedItem: {
    backgroundColor: '#e8f0fe',
  },
  itemText: {
    fontSize: 16,
  },
  selectedItemText: {
    fontWeight: '600',
  },
});
