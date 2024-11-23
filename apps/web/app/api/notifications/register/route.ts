import { supabase } from '@/utils/supabase';
import { NextRequest, NextResponse } from 'next/server';

export const POST = async (req: NextRequest) => {
  try {
    const { expoPushToken, phone } = await req.json();
    if (!phone || !expoPushToken) {
      return NextResponse.json({ error: 'Phone number and FCM token are required' }, { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    // Store or update the expoPushToken in your database for the current user
    const { error } = await supabase
      .from('users')
      .update({ fcm: expoPushToken })
      .eq('phone', phone)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    return NextResponse.json({ success: true }, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}

// Handle OPTIONS method for CORS preflight requests
export async function OPTIONS () {
  return NextResponse.json({}, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}