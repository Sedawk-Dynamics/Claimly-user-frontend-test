/**
 * Normalizes a phone number to exactly 10 digits
 * Removes all non-digit characters and takes the last 10 digits
 * @param phoneNumber - The phone number to normalize
 * @returns A 10-digit phone number string
 */
export function normalizePhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // Take the last 10 digits (handles country codes like +91)
  if (digitsOnly.length >= 10) {
    return digitsOnly.slice(-10);
  }
  
  // If less than 10 digits, return as is (will be caught by validation)
  return digitsOnly;
}

