import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const envUrl = process.env.VITE_SUPABASE_URL || 'https://api.latierrita.tech';
const envKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(envUrl, envKey);

async function run() {
  console.log('Querying column names of chat_rooms...');
  const { data: rooms, error: roomError } = await supabase
    .from('chat_rooms')
    .select('*')
    .limit(1);

  if (roomError) {
    console.error('❌ Error fetching chat_rooms:', roomError);
  } else if (rooms && rooms.length > 0) {
    console.log('✅ chat_rooms keys:', Object.keys(rooms[0]));
  } else {
    console.log('⚠️ chat_rooms is empty!');
  }

  console.log('Querying column names of place_suggestions...');
  const { data: suggestions, error: sugError } = await supabase
    .from('place_suggestions')
    .select('*')
    .limit(1);

  if (sugError) {
    console.error('❌ Error fetching place_suggestions:', sugError);
  } else if (suggestions && suggestions.length > 0) {
    console.log('✅ place_suggestions keys:', Object.keys(suggestions[0]));
  } else {
    console.log('⚠️ place_suggestions is empty!');
  }
}

run();
