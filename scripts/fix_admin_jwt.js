/**
 * This script fixes JWT claims for a specific admin user
 * Run with: node scripts/fix_admin_jwt.js
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

async function fixAdminJwtClaims() {
  try {
    // Target specific user ID - this is the one from the question
    const adminId = '5e4e5971-c6b2-4a1f-b496-a05381749afe';
    
    console.log(`Fixing JWT claims for admin with ID: ${adminId}`);

    // Verify user exists and is admin in profile table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, is_admin, role')
      .eq('id', adminId)
      .single();

    if (profileError) {
      throw new Error(`Error finding admin profile: ${profileError.message}`);
    }

    if (!profile) {
      throw new Error(`No profile found with ID: ${adminId}`);
    }

    console.log('Found admin profile:', profile);

    if (!profile.is_admin || profile.role !== 'admin') {
      console.log('Profile is not set as admin in database. Updating...');
      
      // Update profile first
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          is_admin: true,
          role: 'admin' 
        })
        .eq('id', adminId);

      if (updateError) {
        throw new Error(`Error updating admin status in profile: ${updateError.message}`);
      }
      
      console.log('✅ Updated admin status in profile table');
    }

    // Set JWT claims regardless
    const { error } = await supabase.auth.admin.updateUserById(
      adminId,
      {
        app_metadata: { 
          role: 'admin',
          is_admin: true
        }
      }
    );

    if (error) {
      throw new Error(`Error setting JWT claims: ${error.message}`);
    }

    console.log('✅ Successfully updated JWT claims to admin');
    console.log('The user should now have proper admin access. If not working, have them log out and log back in.');

  } catch (error) {
    console.error('Error fixing admin JWT claims:', error.message);
    process.exit(1);
  }
}

fixAdminJwtClaims(); 