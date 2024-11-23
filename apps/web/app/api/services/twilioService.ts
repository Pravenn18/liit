import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID; // Your Twilio Account SID
const authToken = process.env.TWILIO_AUTH_TOKEN; // Your Twilio Auth Token
const client = twilio(accountSid, authToken);

export const sendOtp = async (phone: string, otp: string) => {
  try {
    const message = await client.messages.create({
      body: `Your OTP code is: ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER, // Twilio verified phone number
      to: phone,
    });
    return message;
  } catch (error) {
    console.error("Error sending OTP:", error);
    throw error;
  }
};
