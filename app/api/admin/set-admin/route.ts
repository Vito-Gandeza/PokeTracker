import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = 'https://znvwokdnmwbkuavsxqin.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpudndva2RubXdia3VhdnN4cWluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzQ3MjMwOCwiZXhwIjoyMDU5MDQ4MzA4fQ.UpqfFOgyzSLPrZDe_XQnYV6sUpx2G5EKAA86mD_c5Ns';

// Create a Supabase client with the service role key
const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const { userId, adminSecret } = await request.json();
    
    // Validate inputs
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Basic security check - require a secret to prevent abuse
    // In production, use a proper authentication system
    if (adminSecret !== 'admin-setup-secret') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // First update the database
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .update({ 
        is_admin: true,
        role: 'admin'
      })
      .eq('id', userId);
      
    if (dbError) {
      return NextResponse.json({ error: `Database update failed: ${dbError.message}` }, { status: 500 });
    }
    
    // Then update the JWT claims
    const { error: jwtError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        app_metadata: { 
          role: 'admin',
          is_admin: true
        }
      }
    );
    
    if (jwtError) {
      return NextResponse.json({ 
        error: `JWT claims update failed: ${jwtError.message}`,
        partialSuccess: true
      }, { status: 500 });
    }
    
    // Success!
    return NextResponse.json({ 
      success: true,
      message: 'User admin status updated successfully'
    });
    
  } catch (err: any) {
    console.error('Error in set-admin API:', err);
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
} 