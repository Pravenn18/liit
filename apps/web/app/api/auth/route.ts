import { NextRequest, NextResponse } from 'next/server';
import Twilio from 'twilio';

const client = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function POST(req: NextRequest) {
  const { phone, otp } = await req.json();

  if (!phone || !otp) {
    return NextResponse.json({ message: 'Phone number and OTP are required.' }, { status: 400 });
  }

  try {
    const message = await client.messages.create({
      body: `Your OTP is ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });
    return NextResponse.json({ message: 'OTP sent successfully', sid: message.sid }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to send OTP', error }, { status: 500 });
  }
}
