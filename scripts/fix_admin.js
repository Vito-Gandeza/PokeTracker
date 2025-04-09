/**
 * This script fixes admin permissions for the existing admin user
 * Run with: node scripts/fix_admin.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase client configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL or Service Role Key not found in environment variables');
  console.error('Make sure to create a .env.local file with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to set admin JWT claims
async function setAdminJwtClaims(userId, isAdmin) {
  try {
    const { error } = await supabase.auth.admin.updateUserById(
      userId,
      {
        app_metadata: { 
          role: isAdmin ? 'admin' : 'user',
          is_admin: isAdmin
        }
      }
    );

    if (error) {
      throw new Error(`Error setting admin JWT claims: ${error.message}`);
    }
    
    return true;
  } catch (err) {
    console.error('Error setting admin JWT claims:', err);
    return false;
  }
}

async function fixAdminPermissions() {
  try {
    // Admin user email - should match the one used in create_admin.js
    const adminEmail = 'admin@gmail.com';
    
    console.log(`Checking admin permissions for user with email: ${adminEmail}`);

    // First, find the user by email
    const { data: users, error: searchError } = await supabase
      .from('profiles')
      .select('id, email, is_admin, role')
      .eq('email', adminEmail);

    if (searchError) {
      throw new Error(`Error searching for admin user: ${searchError.message}`);
    }

    if (!users || users.length === 0) {
      console.error(`No user found with email ${adminEmail}`);
      console.log('Run the create_admin.js script first to create the admin user.');
      process.exit(1);
    }

    const adminUser = users[0];
    console.log('Found user:', adminUser);

    // Check if user is already correctly set as admin
    if (adminUser.is_admin && adminUser.role === 'admin') {
      console.log(`User ${adminEmail} already has correct admin permissions.`);
    } else {
      console.log(`User ${adminEmail} has incorrect admin permissions. Fixing...`);
      
      // Update the user's admin status directly
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          is_admin: true,
          role: 'admin' 
        })
        .eq('id', adminUser.id);

      if (updateError) {
        throw new Error(`Error updating admin permissions: ${updateError.message}`);
      }

      // Update JWT claims
      const jwtClaimsSet = await setAdminJwtClaims(adminUser.id, true);
      if (!jwtClaimsSet) {
        console.warn('Warning: Profile was updated but JWT claims could not be set.');
        console.log('The user may need to log out and log back in for admin access to work properly.');
      } else {
        console.log('✅ JWT claims updated successfully.');
      }

      // Double-check using RPC function
      const { error: rpcError } = await supabase.rpc(
        'set_admin_role',
        { user_id: adminUser.id, set_admin: true }
      );

      if (rpcError) {
        console.warn(`Warning: RPC function error: ${rpcError.message}`);
        console.log('Direct update was performed, but the RPC function failed.');
      }

      console.log(`✅ Successfully fixed admin permissions for user: ${adminEmail}`);
    }

    // Verify the fix worked
    const { data: verifyData, error: verifyError } = await supabase
      .from('profiles')
      .select('id, email, is_admin, role')
      .eq('id', adminUser.id)
      .single();

    if (verifyError) {
      throw new Error(`Error verifying fix: ${verifyError.message}`);
    }

    console.log('Final admin user status:', verifyData);
    
    if (verifyData.is_admin && verifyData.role === 'admin') {
      console.log('✅ Admin permissions have been verified.');
    } else {
      console.log('❌ Admin permissions are still incorrect. Please contact support.');
    }

  } catch (error) {
    console.error('Error fixing admin permissions:', error.message);
    process.exit(1);
  }
}

fixAdminPermissions(); 