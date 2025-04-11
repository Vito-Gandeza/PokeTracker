/**
 * This script checks the Supabase connection and attempts to fix common issues
 * Run with: node scripts/check-connection.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('Error: Missing Supabase environment variables');
  console.error('Make sure you have the following in your .env file:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase clients
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Maximum number of retries
const MAX_RETRIES = 3;

// Function to test connection with retry logic
async function testConnection(client, name, retries = 0) {
  try {
    console.log(`Testing ${name} connection...`);
    
    // Test basic query
    const { data, error } = await client
      .from('cards')
      .select('id, name')
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    console.log(`✅ ${name} connection successful`);
    return true;
  } catch (error) {
    console.error(`❌ ${name} connection failed:`, error.message);
    
    if (retries < MAX_RETRIES) {
      console.log(`Retrying ${name} connection (${retries + 1}/${MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
      return testConnection(client, name, retries + 1);
    }
    
    return false;
  }
}

// Function to check database health
async function checkDatabaseHealth() {
  try {
    console.log('Checking database health...');
    
    // Check if we can execute a simple query
    const { data, error } = await supabaseAdmin.rpc('get_server_time');
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Database health check passed');
    console.log('Server time:', data);
    return true;
  } catch (error) {
    console.error('❌ Database health check failed:', error.message);
    return false;
  }
}

// Function to check for and fix common issues
async function diagnoseAndFix() {
  console.log('=== Supabase Connection Diagnostic Tool ===');
  
  // Test anonymous client connection
  const anonConnected = await testConnection(supabaseAnon, 'Anonymous client');
  
  // Test service role client connection
  const adminConnected = await testConnection(supabaseAdmin, 'Service role client');
  
  // Check database health if at least one connection worked
  let dbHealthy = false;
  if (anonConnected || adminConnected) {
    dbHealthy = await checkDatabaseHealth();
  }
  
  // Summary
  console.log('\n=== Diagnostic Summary ===');
  console.log(`Anonymous client: ${anonConnected ? '✅ Connected' : '❌ Failed'}`);
  console.log(`Service role client: ${adminConnected ? '✅ Connected' : '❌ Failed'}`);
  console.log(`Database health: ${dbHealthy ? '✅ Healthy' : '❌ Issues detected'}`);
  
  // Recommendations
  console.log('\n=== Recommendations ===');
  
  if (!anonConnected && !adminConnected) {
    console.log('❌ All connections failed. Possible issues:');
    console.log('1. Check if your Supabase project is online');
    console.log('2. Verify your environment variables are correct');
    console.log('3. Check for network connectivity issues');
    console.log('4. Your IP might be blocked or restricted');
  } else if (!anonConnected) {
    console.log('⚠️ Anonymous client failed but service role works:');
    console.log('1. Check if anonymous access is enabled in your Supabase project');
    console.log('2. Verify your NEXT_PUBLIC_SUPABASE_ANON_KEY is correct');
    console.log('3. Check Row Level Security (RLS) policies');
  } else if (!adminConnected) {
    console.log('⚠️ Service role client failed but anonymous works:');
    console.log('1. Verify your SUPABASE_SERVICE_ROLE_KEY is correct');
    console.log('2. Check if your service role has the necessary permissions');
  } else if (!dbHealthy) {
    console.log('⚠️ Connections work but database health check failed:');
    console.log('1. Your database might be under heavy load');
    console.log('2. Check for database errors in the Supabase dashboard');
    console.log('3. Verify that required functions like get_server_time exist');
  } else {
    console.log('✅ All checks passed! Your Supabase connection is working correctly.');
  }
}

// Run the diagnostic
diagnoseAndFix().catch(error => {
  console.error('Error running diagnostics:', error);
  process.exit(1);
});
