import { I18n } from 'i18n-js';
import { getLocales, useLocales } from 'expo-localization';
import { createContext } from 'react';

const translations = {
  en: {
    takePhoto: 'TAKE PHOTO',
    submit: 'SUBMIT',
    hello: 'Hello',
    signOut: 'SIGN OUT',
    user: 'User',
    harvest: 'Harvest',
    signInWarning: 'You need to sign in to submit data.',
    goToUser: 'GO TO USER TAB',
    selectGarden: 'Select a garden',
    selectCrop: 'Select a crop',
    participation: 'Participation',
    logParticipation: 'LOG PARTICIPATION',
    participationLogged: 'Participation logged',
    totalToday: 'Total today',
    startHarvest: 'START HARVESTING',
    back: 'BACK',
    optional: 'optional',
  },
  es: {
    takePhoto: 'TOMAR FOTO',
    submit: 'ENTREGAR',
    hello: 'Hola',
    signOut: 'DESCONECTAR',
    user: 'Usuario',
    harvest: 'Cosechar',
    signInWarning: 'Debes iniciar sesión para enviar datos.',
    goToUser: 'IR A LA PESTAÑA DE USUARIO',
    selectGarden: 'Selecciona un jardín',
    selectCrop: 'Seleccione un cultivo',
    participation: 'Participación',
    logParticipation: 'REGISTRAR PARTICIPACIÓN',
    participationLogged: 'Participación registrada',
    totalToday: 'Total hoy',
    startHarvest: 'EMPEZAR A COSECHAR',
    back: 'REGRESA',
    optional: 'opcional',
  },
};

const i18n = new I18n(translations);

i18n.enableFallback = true;

i18n.locale = getLocales()[0].languageTag ?? 'en';

export const i18nContext = createContext(i18n);

export function useI18n() {
  const i18n = new I18n(translations);
  i18n.enableFallback = true;
  i18n.locale = useLocales()[0].languageTag ?? 'en';
  return i18n;
}
