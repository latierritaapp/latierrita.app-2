import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

// Standard seeder JWT generator
const jwtSecret = process.env.JWT_SECRET || '83MoTh7uamYte56x58VfcUgwMZH8oacP';
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://api.latierrita.tech';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || '';

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function generateJWT(payload: any, secret: string): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signatureInput)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${signatureInput}.${signature}`;
}

const iat = Math.floor(Date.now() / 1000);
const exp = iat + (50 * 365 * 24 * 60 * 60);
const serviceRoleJWT = serviceRoleKey || generateJWT({ role: 'service_role', iss: 'supabase', aud: 'anon', iat, exp }, jwtSecret);

async function clean() {
  console.log('Connecting to Supabase via Service Role to clean up bad rows...');
  
  // Use the service role client
  const supabase = createClient(supabaseUrl, serviceRoleJWT, {
    auth: { persistSession: false }
  });

  // Deleting bad rows where code is null or place_name matches test patterns
  const { data, error } = await supabase
    .from('place_suggestions')
    .delete()
    .or('code.is.null,id.eq.test-undef-1790788766766,id.eq.test-undef-1790788855814');

  if (error) {
    console.error('❌ Error deleting bad rows:', error);
  } else {
    console.log('✅ Clean up completed successfully!', data);
  }

  // Let's double check what remains
  const { data: remaining } = await supabase
    .from('place_suggestions')
    .select('id, code, place_name');
  console.log('Remaining place suggestions:', remaining);
}

clean();
