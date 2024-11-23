import { supabase } from './supabase';

export const initiatePhoneAuth = async (
  phone: string,
  name: string,
  setOtp: (otp: string) => void,
) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
  setOtp(otp);
  // Save the OTP to the database
  //   const { data, error } = await supabase
  //     .from('users')
  //     .upsert({ phone, otp })
  //     .eq('phone', phone);

  //   return { data, error };
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('id')
    .eq('phone', phone)
    .single();

  if (fetchError) {
    const { data } = await supabase
      .from('users')
      .upsert({ phone, otp, name })
      .eq('phone', phone);

    return { data, Error };
  }

  // Step 2: If user exists, update the `otp` column; if not, insert a new record
  if (existingUser) {
    const { data, error } = await supabase
      .from('users')
      .update({ otp })
      .eq('phone', phone);

    if (error) {
      console.error('Error updating OTP:', error);
      return { error };
    }

    return { data, message: 'OTP updated successfully' };
  }
};

export const verifyOtp = async (phone: string, inputOtp: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, otp')
    .eq('phone', phone)
    .single();

  if (error || !data || data.otp !== inputOtp) {
    console.log('verifyOTPerror');
    throw new Error('Invalid OTP');
  }
  return data.id; // Return the user ID on success
};
