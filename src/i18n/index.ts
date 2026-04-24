import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './en.json'
import hu from './hu.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hu: { translation: hu },
    },
    fallbackLng: 'hu',
    detection: {
      order: ['cookie', 'localStorage'],
      lookupCookie: 'kalmio-lang',
      caches: ['cookie'],
      cookieMinutes: 525_600, // 1 year
    },
    interpolation: { escapeValue: false },
  })

export default i18n
