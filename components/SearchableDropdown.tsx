import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface Props {
  label: string;
  items: string[];
  selected: string;
  onSelect: (value: string) => void;
  placeholder?: string;
}

export default function SearchableDropdown({ label, items, selected, onSelect, placeholder }: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<TextInput>(null);
  const s = styles(colors);

  const filtered = search
    ? items.filter((i) => i.toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <View style={s.wrapper}>
      <Text style={s.label}>{label}</Text>
      <TouchableOpacity
        style={s.selector}
        onPress={() => { setOpen(true); setSearch(''); }}
        activeOpacity={0.7}
      >
        <Text style={[s.selectorText, !selected && s.placeholder]}>
          {selected || placeholder || `Select ${label}`}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity
          style={s.overlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={s.modal}>
            <TextInput
              ref={inputRef}
              style={s.searchInput}
              placeholder="Search..."
              placeholderTextColor={colors.textSecondary}
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
            <FlatList
              data={filtered}
              keyExtractor={(item) => item}
              style={s.list}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[s.item, item === selected && s.itemSelected]}
                  onPress={() => { onSelect(item); setOpen(false); }}
                >
                  <Text style={[s.itemText, item === selected && s.itemTextSelected]}>
                    {item}
                  </Text>
                  {item === selected && (
                    <MaterialCommunityIcons name="check" size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={s.emptyText}>No results found</Text>
              }
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = (colors: any) =>
  StyleSheet.create({
    wrapper: { marginBottom: 12 },
    label: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 6,
      marginTop: 4,
    },
    selector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.inputBg,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    selectorText: {
      fontSize: 15,
      color: colors.text,
      flex: 1,
    },
    placeholder: { color: colors.textSecondary || '#999' },
    overlay: {
      flex: 1,
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
      paddingHorizontal: 24,
    },
    modal: {
      backgroundColor: colors.card,
      borderRadius: 20,
      maxHeight: '60%',
      overflow: 'hidden',
    },
    searchInput: {
      backgroundColor: colors.inputBg,
      margin: 12,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    list: { maxHeight: 300 },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    itemSelected: { backgroundColor: colors.primary + '10' },
    itemText: { fontSize: 15, color: colors.text },
    itemTextSelected: { fontWeight: '700', color: colors.primary },
    emptyText: {
      textAlign: 'center',
      padding: 24,
      color: colors.textSecondary,
      fontSize: 14,
    },
  });
