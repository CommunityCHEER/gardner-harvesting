import { DocumentReference } from 'firebase/firestore';

export interface User {
  firstName: string;
  lastName: string;
}

export interface Harvest {
  date: string;
  person: DocumentReference;
  garden: DocumentReference;
  crop: DocumentReference;
}

export interface HarvestMeasure {
  unit: DocumentReference;
  measure: number;
}

export interface RealtimeHarvest {
  person: string;
  measures: { unit: string; measure: number }[];
}

export interface Garden {
  houseNumber: string;
  streetName: string;
  nickname: string;
}

export interface Participation {
  date: string;
  garden: DocumentReference;
}

export interface Crop {
  ezID: string;
  name: {
    [locale: string]: { value: string };
  };
  units: {
    [locale: string]: { value: string };
  };
}
