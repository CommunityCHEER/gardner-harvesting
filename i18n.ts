import { I18n } from "i18n-js";
import { getLocales, useLocales } from "expo-localization";
import { createContext } from "react";

const translations = {
  en: {
    photo: "TAKE PHOTO",
    upload: "UPLOAD",
    hello: "Hello",
    signOut: "SIGN OUT",
    user: "User",
    home: "Home",
    signInWarning: "You need to sign in to submit data.",
    goToUser: "GO TO USER TAB",
  },
  es: {
    photo: "TOMAR FOTO",
    upload: "SUBIR",
    hello: "Hola",
    signOut: "DESCONECTAR",
    user: "Usuario",
    home: "Hogar",
    signInWarning: "Debes iniciar sesión para enviar datos.",
    goToUser: "IR A LA PESTAÑA DE USUARIO",
  },
};

const i18n = new I18n(translations);

i18n.enableFallback = true;

i18n.locale = getLocales()[0].languageTag ?? "en";

export const i18nContext = createContext(i18n);

export function useI18n() {
  const i18n = new I18n(translations);
  i18n.enableFallback = true;
  i18n.locale = useLocales()[0].languageTag ?? "en";
  return i18n;
}
