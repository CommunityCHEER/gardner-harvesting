import { create } from 'zustand';

interface HarvestFormState {
  crop: string | null;
  setCrop: (crop: string | null) => void;
  note: string;
  setNote: (note: string) => void;
  noteModalVisible: boolean;
  setNoteModalVisible: (visible: boolean) => void;
}

const useStore = create<HarvestFormState>()((set) => ({
  crop: null,
  setCrop: (crop) => set({ crop }),
  note: '',
  setNote: (note) => set({ note }),
  noteModalVisible: false,
  setNoteModalVisible: (visible) => set({ noteModalVisible: visible }),
}));

export default useStore;
