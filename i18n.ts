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
    signIn: 'Login',
    switchToSignUp: 'Register',
    switchToSignIn: 'Switch to login',
    or: 'or',
    signUp: 'Register',
    firstNameLength: 'First Name must be between 2 and 50 characters.',
    lastNameLength: 'Last Name must be between 2 and 50 characters.',
    invalidEmail: 'Invalid email format.',
    invalidPassword:
      'Password must be between 12 and 50 characters and contain at least 1 upper case letter, 1 lower case letter, 1 number, and 1 special character.',
    emailAlreadyRegistered: 'Email already registered.',
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
    signIn: 'Iniciar sesión',
    switchToSignUp: 'Inscribirse',
    switchToSignIn: 'Cambiar a iniciar sesión',
    or: 'o',
    signup: 'Inscribirse',
    firstNameLength: 'El nombre debe tener entre 2 y 50 caracteres.',
    lastNameLength: 'El apellido debe tener entre 2 y 50 caracteres.',
    invalidEmail: 'Formato de correo electrónico no válido.',
    invalidPassword:
      'La contraseña debe tener entre 12 y 50 caracteres y contener al menos 1 letra mayúscula, 1 letra minúscula, 1 número y 1 carácter especial.',
    emailAlreadyRegistered: 'Correo electrónico ya registrado.',
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
