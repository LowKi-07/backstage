import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

// Photograph or choose a receipt. Returns the image URI, null if cancelled, or throws a readable message.
export async function pickImage(source: 'camera' | 'library'): Promise<string | null> {
  const useCamera = source === 'camera' && Platform.OS !== 'web';
  if (useCamera) {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) throw new Error('Camera permission is needed to photograph receipts.');
  }
  const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.5 };
  try {
    const res = useCamera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    return !res.canceled && res.assets[0] ? res.assets[0].uri : null;
  } catch {
    throw new Error('Couldn’t open the camera or gallery on this device.');
  }
}
