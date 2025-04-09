const { createClient } = require('@supabase/supabase-js');

// Get environment variables
// Make sure to set these environment variables before running this script
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set');
  process.exit(1);
}

// Create admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser(email: string, password: string) {
  try {
    // 1. Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        is_admin: true
      }
    });

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      throw new Error('No user created');
    }

    // 2. Set admin claims in JWT
    const { error: claimsError } = await supabaseAdmin.auth.admin.updateUserById(
      authData.user.id,
      {
        app_metadata: {
          is_admin: true
        }
      }
    );

    if (claimsError) {
      throw claimsError;
    }

    // 3. Update the automatically created user profile
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        is_admin: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', authData.user.id);

    if (updateError) {
      throw updateError;
    }

    console.log('Admin user created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('User ID:', authData.user.id);

  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

// Get command line arguments
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Please provide email and password as command line arguments');
  process.exit(1);
}

// Create admin user
createAdminUser(email, password);