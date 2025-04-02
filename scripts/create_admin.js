/**
 * This script creates an initial admin user in Supabase
 * Run with: node scripts/create_admin.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase client configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL or Service Role Key not found in environment variables');
  console.error('Make sure to create a .env.local file with these variables');
  process.exit(1);
}

// Create Supabase admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser() {
  try {
    // Admin user configuration - these can be changed as needed
    const adminEmail = 'admin@gmail.com';
    const adminPassword = 'admin_password'; // Should be stronger in production
    const adminName = 'Admin User';
    const adminUsername = 'admin';

    console.log(`Creating admin user with email: ${adminEmail}`);

    // First, check if user exists
    const { data: existingUsers, error: searchError } = await supabase
      .from('profiles')
      .select('id, is_admin, email')
      .eq('email', adminEmail);

    if (searchError) {
      throw new Error(`Error searching for existing user: ${searchError.message}`);
    }

    // If user exists and is already admin
    if (existingUsers && existingUsers.length > 0 && existingUsers[0].is_admin) {
      console.log(`Admin user with email ${adminEmail} already exists`);
      return;
    }

    // Create new user if it doesn't exist
    if (!existingUsers || existingUsers.length === 0) {
      const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          full_name: adminName,
          username: adminUsername
        }
      });

      if (createError) {
        throw new Error(`Error creating user: ${createError.message}`);
      }

      console.log(`Created new user with ID: ${authUser.user.id}`);

      // Set admin role through our custom function
      const { error: roleError } = await supabase.rpc(
        'set_admin_role',
        { user_id: authUser.user.id, set_admin: true }
      );

      if (roleError) {
        throw new Error(`Error setting admin role: ${roleError.message}`);
      }

      console.log(`Successfully set admin role for user: ${adminEmail}`);
    } else {
      // User exists but is not admin, update the role
      const userId = existingUsers[0].id;
      
      // Set admin role
      const { error: roleError } = await supabase.rpc(
        'set_admin_role',
        { user_id: userId, set_admin: true }
      );

      if (roleError) {
        throw new Error(`Error setting admin role: ${roleError.message}`);
      }

      console.log(`Successfully updated existing user to admin: ${adminEmail}`);
    }

    console.log('Admin user setup completed');
  } catch (error) {
    console.error('Error creating admin user:', error.message);
    process.exit(1);
  }
}

createAdminUser(); 