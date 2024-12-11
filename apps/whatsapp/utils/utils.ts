export const formatPhoneNumber = (phoneNumber: string): string => {
  const cleanedNumber = phoneNumber.replace(/\D/g, '');
  return cleanedNumber.slice(-10);
};
