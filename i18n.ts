import { I18n } from 'i18n-js';
import { getLocales, useLocales } from 'expo-localization';
import { createContext } from 'react';

const translations = {
  en: {
    takePhoto: 'TAKE PHOTO',
    submit: 'SUBMIT',
    addNote: 'ADD NOTE',
    editNote: 'EDIT NOTE',
    saveNote: 'SAVE NOTE',
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
    switchToSignIn: 'Login',
    or: 'or',
    signUp: 'Register',
    authSubmit: 'Submit',
    goBack: 'Go Back',
    loginTitle: 'Login To Your Account',
    registerTitle: 'Register A New Account',
    forgotPasswordPrompt: 'Forgot your password? Click the button below to...',
    resetPasswordButton: '...Request a Password Reset',
    firstNameLength: 'First Name must be between 2 and 50 characters.',
    lastNameLength: 'Last Name must be between 2 and 50 characters.',
    invalidEmail: 'Invalid email format.',
    invalidPassword:
      'Password must be between 12 and 50 characters and contain at least 1 upper case letter, 1 lower case letter, 1 number, and 1 special character.',
    emailAlreadyRegistered: 'Email already registered.',
    invalidCredential: 'Invalid email or password. Please try again.',
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email',
    password: 'Password',
    resetPassword: 'Request password reset',
    qForgotPassword: 'Forgot your password?',
    resetEmailSent:
      'If we have an account with that email, a password reset email will be sent. Don`t forget to check your spam folder!',
    youAreDeveloper: 'You are a developer',
    youAreGardener: 'You are a gardener',
    youAreAdmin: 'You are an admin',
    youHaveNoRole: 'You have not been assigned a role',
    deleteAccount: 'Remove Account',
    accountDeleted: 'Account removed',
    noClaimsForGardens: 'You do not have permission to see the gardens list.',
    refreshClaims: 'Click to check for updated permissions',
    ounces: 'ounces',
    identifying: 'Identifying...',
    analyzingPhoto: 'Analyzing photo...',
    photoMatchedTo: 'Photo matched to',
    useCrop: 'Use %{cropName}',
    takeADifferentPhoto: 'Take a different photo',
    chooseManually: 'Choose manually',
    cancel: 'Cancel',
    noMatchFound: 'No match found. Please try another photo or choose manually.',
    loadingUnitOptions: 'Loading measurement options...',
    orDivider: 'Or',
    smartHarvestHelp: 'Take a photo and try the new smart-crop-selection feature!',
    smartHarvestFailed: 'Unable to identify crop. Please try again or select manually.',
  },
  es: {
    takePhoto: 'TOMAR FOTO',
    submit: 'ENTREGAR',
    addNote: 'AGREGAR NOTA',
    editNote: 'EDITAR NOTA',
    saveNote: 'GUARDAR NOTA',
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
    switchToSignIn: 'Iniciar sesión',
    or: 'o',
    signUp: 'Inscribirse',
    authSubmit: 'Entregar',
    goBack: 'Regresar',
    loginTitle: 'Inicia sesión en tu cuenta',
    registerTitle: 'Registra una nueva cuenta',
    forgotPasswordPrompt: '¿Olvidaste tu contraseña? Haz clic en el botón de abajo para...',
    resetPasswordButton: '...Solicitar un restablecimiento de contraseña',
    firstNameLength: 'El nombre debe tener entre 2 y 50 caracteres.',
    lastNameLength: 'El apellido debe tener entre 2 y 50 caracteres.',
    invalidEmail: 'Formato de correo electrónico no válido.',
    invalidPassword:
      'La contraseña debe tener entre 12 y 50 caracteres y contener al menos 1 letra mayúscula, 1 letra minúscula, 1 número y 1 carácter especial.',
    emailAlreadyRegistered: 'Correo electrónico ya registrado.',
    invalidCredential:
      'Correo electrónico o contraseña no válidos. Por favor, inténtelo de nuevo.',
    firstName: 'Nombre de pila',
    lastName: 'Apellido',
    email: 'Correo electrónico',
    password: 'Contraseña',
    resetPassword: 'Solicitar cambio de contraseña',
    qForgotPassword: '¿Olvidaste tu contraseña?',
    resetEmailSent:
      'Si tenemos una cuenta con ese correo electrónico, se enviará un correo electrónico para restablecer la contraseña. ¡No olvides revisar tu carpeta de correo no deseado!',
    youAreDeveloper: 'Eres un desarrollador',
    youAreGardener: 'Eres un jardinero',
    youAreAdmin: 'Eres un administrador',
    youHaveNoRole: 'No se te ha asignado un rol',
    deleteAccount: 'Eliminar cuenta',
    accountDeleted: 'Cuenta eliminada',
    noClaimsForGardens: 'No tienes permiso para ver la lista de jardines.',
    refreshClaims: 'Haz clic para comprobar los permisos actualizados',
    orDivider: 'O',
    smartHarvestHelp: '¡Toma una foto e intenta la nueva función de identificación inteligente de cultivos!',
    smartHarvestFailed: 'No se pudo identificar el cultivo. Por favor, intenta de nuevo o selecciona manualmente.',
    ounces: 'onzas',
    identifying: 'Identificando...',
    analyzingPhoto: 'Analizando foto...',
    photoMatchedTo: 'La foto coincide con',
    useCrop: 'Usar %{cropName}',
    takeADifferentPhoto: 'Tomar una foto diferente',
    chooseManually: 'Elegir manualmente',
    cancel: 'Cancelar',
    noMatchFound: 'No se encontró coincidencia. Intenta otra foto o elige manualmente.',
    loadingUnitOptions: 'Cargando opciones de medida...',
  },
};

/**
 * The I18n instance used for internationalization.
 */
const i18n = new I18n(translations);

i18n.enableFallback = true;

i18n.locale = getLocales()?.[0]?.languageTag ?? 'en';

/**
 * React context for providing the I18n instance to components.
 */
export const i18nContext = createContext(i18n);

/**
 * A hook for accessing the I18n instance.
 * @returns {I18n} The I18n instance.
 */
export function useI18n() {
  const i18n = new I18n(translations);
  i18n.enableFallback = true;
  i18n.locale = useLocales()?.[0]?.languageTag ?? 'en';
  return i18n;
}
