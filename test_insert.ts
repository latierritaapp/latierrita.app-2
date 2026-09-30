import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const envUrl = process.env.VITE_SUPABASE_URL || 'https://api.latierrita.tech';
const envKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(envUrl, envKey);

async function run() {
  console.log('Inserting test place suggestion...');
  const payload = {
    id: `test-sug-${Date.now()}`,
    user_id: 'anonymous',
    user_name: 'Invitado / Público',
    user_username: 'invitado',
    user_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    code: 'SUG-TEST',
    place_name: 'Lugar de Prueba',
    category: 'Restaurante/Cafe',
    city: 'Madrid',
    address: 'Calle Falsa 123',
    in_google_maps: true,
    is_owner: false,
    phone: '600000000',
    description: 'Descripción de prueba',
    image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600',
    website: 'https://prueba.com',
    social_links: { instagram: '@prueba' },
    status: 'pendientes',
    date: '30 de sep de 2026',
    created_at: Date.now(),
    chat_room_id: ''
  };

  const { data, error } = await supabase.from('place_suggestions').insert([payload]);
  if (error) {
    console.error('❌ Insert failed:', error);
  } else {
    console.log('✅ Insert succeeded!', data);
  }
}

run();
