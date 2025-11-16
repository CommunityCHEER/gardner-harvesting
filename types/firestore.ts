import { DocumentReference } from 'firebase/firestore';

/**
 * Represents a user in the application.
 */
export interface User {
  /** The user's first name. */
  firstName: string;
  /** The user's last name. */
  lastName: string;
  /** The user's role. */
  role: string;
  /** Whether the user has administrator privileges. */
  admin: boolean;
  /** Whether the user has gardener privileges. */
  gardener: boolean;
  /** Whether the user has developer privileges. */
  developer: boolean;
}

/**
 * Represents a harvest entry in Firestore.
 */
export interface Harvest {
  /** The date of the harvest in `YYYY-MM-DD` format. */
  date: string;
  /** A reference to the person who made the harvest. */
  person: DocumentReference;
  /** A reference to the garden where the harvest was made. */
  garden: DocumentReference;
  /** A reference to the crop that was harvested. */
  crop: DocumentReference;
  /** An optional note about the harvest. */
  note?: string;
}

/**
 * Represents a single measurement of a harvest.
 */
export interface HarvestMeasure {
  /** A reference to the unit of measurement. */
  unit: DocumentReference;
  /** The measured quantity. */
  measure: number;
}

/**
 * Represents a harvest entry in the Realtime Database.
 */
export interface RealtimeHarvest {
  /** The ID of the person who made the harvest. */
  person: string;
  /** An array of measurements for the harvest. */
  measures: { unit: string; measure: number }[];
}

/**
 * Represents a garden.
 */
export interface Garden {
  /** The house number of the garden's address. */
  houseNumber: string;
  /** The street name of the garden's address. */
  streetName: string;
  /** A nickname for the garden. */
  nickname: string;
}

/**
 * Represents a participation entry.
 */
export interface Participation {
  /** The date of participation in `YYYY-MM-DD` format. */
  date: string;
  /** A reference to the garden where the participation occurred. */
  garden: DocumentReference;
}

/**
 * Represents a unit of measurement.
 */
export interface Unit {
  /** The abbreviation for the unit. */
  abbreviation: string;
  /** Whether the unit can be expressed as a fraction. */
  fractional: boolean;
  /** The EZ-ID of the unit. */
  ezID: string;
}

/**
 * Represents a type of crop.
 */
export interface Crop {
  /** The EZ-ID of the crop. */
  ezID: string;
  /** A map of locale codes to the crop's name in that language. */
  name: {
    [locale: string]: { value: string };
  };
  /** A map of unit IDs to their values. */
  units: {
    [id: string]: { value: string };
  };
}
