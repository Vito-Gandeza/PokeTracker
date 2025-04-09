import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Create a service role client for admin operations 
// This bypasses RLS completely
const createServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase service role credentials');
    return null;
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
};

export async function GET(request: NextRequest) {
  try {
    // Get the type of data to fetch from query params
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Validate the request type
    if (!type || !['users', 'cards', 'collections'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type parameter. Must be one of: users, cards, collections' },
        { status: 400 }
      );
    }
    
    // Create server client to get the session
    const authClient = createServerComponentClient({ cookies });
    
    // Verify the user is authenticated and is an admin
    const { data: { session } } = await authClient.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the user's profile to check admin status
    const { data: profile, error: profileError } = await authClient
      .from('profiles')
      .select('role, is_admin')
      .eq('id', session.user.id)
      .single();
      
    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({ error: 'Error fetching user profile' }, { status: 500 });
    }
    
    // Check if the user is an admin
    const isAdmin = profile.is_admin === true || profile.role === 'admin';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }
    
    // Create service client that bypasses RLS
    const serviceClient = createServiceClient();
    if (!serviceClient) {
      return NextResponse.json(
        { error: 'Server configuration error - could not create admin client' },
        { status: 500 }
      );
    }
    
    // Fetch the requested data using the service client (bypasses RLS)
    let data;
    let error;
    
    switch (type) {
      case 'users':
        ({ data, error } = await serviceClient
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1));
        break;
        
      case 'cards':
        ({ data, error } = await serviceClient
          .from('cards')
          .select('*')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1));
        break;
        
      case 'collections':
        ({ data, error } = await serviceClient
          .from('collections')
          .select('*')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1));
        break;
    }
    
    if (error) {
      console.error(`Error fetching ${type}:`, error);
      return NextResponse.json({ error: `Error fetching ${type}: ${error.message}` }, { status: 500 });
    }
    
    return NextResponse.json({ data });
    
  } catch (err) {
    console.error('Unexpected error in admin API:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 