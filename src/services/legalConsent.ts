import AsyncStorage from "@react-native-async-storage/async-storage";

const CONSENT_KEY = "choapptrans:legalConsent:v1";

export async function loadLegalConsent(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(CONSENT_KEY);
    return value === "1";
  } catch {
    return false;
  }
}

export async function saveLegalConsent(): Promise<void> {
  await AsyncStorage.setItem(CONSENT_KEY, "1");
}
