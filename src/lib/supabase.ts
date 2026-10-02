// Robust local-first Supabase client mock supporting all auth, rpc, channel, and query methods to eliminate 404 errors entirely

class LocalSupabaseQueryBuilder {
  table: string;
  operation: 'select' | 'upsert' | 'insert' | 'update' | 'delete' = 'select';
  payload: any = null;
  filters: Array<{ field: string; op: string; value: any }> = [];

  constructor(table: string) {
    this.table = table;
  }

  select(queryStr = '*') {
    this.operation = 'select';
    return this;
  }

  insert(data: any) {
    this.operation = 'insert';
    this.payload = data;
    return this;
  }

  upsert(data: any, options?: any) {
    this.operation = 'upsert';
    this.payload = data;
    return this;
  }

  update(data: any) {
    this.operation = 'update';
    this.payload = data;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push({ field, op: 'eq', value });
    return this;
  }

  or(queryStr: string) {
    return this;
  }

  ilike(field: string, value: any) {
    this.filters.push({ field, op: 'ilike', value });
    return this;
  }

  limit(count: number) {
    return this;
  }

  order(column: string, options?: any) {
    return this;
  }

  maybeSingle() {
    return this.execute().then(res => ({
      data: Array.isArray(res.data) ? (res.data[0] || null) : res.data,
      error: res.error
    }));
  }

  single() {
    return this.maybeSingle();
  }

  then(resolve: (res: { data: any; error: any }) => void, reject?: (err: any) => void) {
    return this.execute().then(resolve, reject);
  }

  async execute() {
    try {
      const storageKey = `latierrita_db_${this.table}`;
      let stored = [];
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) stored = JSON.parse(raw);
      } catch {}

      // Default seed data for certain tables if empty
      if (stored.length === 0) {
        if (this.table === 'posts') {
          stored = [
            {
              id: 'post-init-1',
              user_id: 'user-carlos',
              username: 'carlos_valencia',
              user_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
              media_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
              caption: '¡Disfrutando de un buen sancocho y empanadas con la familia en Madrid! Se siente el calor de nuestra tierrita aquí en España. 🇨🇴🇪🇸',
              city: 'Madrid',
              likes_count: 3,
              has_liked: false,
              comments: [],
              timestamp: 'Hace 3 horas',
              location: 'Madrid, España'
            }
          ];
        } else if (this.table === 'profiles') {
          stored = [
            {
              id: 'user-carlos',
              username: 'carlos_valencia',
              name: 'Carlos Valencia',
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
              city: 'Madrid',
              origin_city: 'Medellín',
              followers_count: 12,
              following_count: 8,
              posts_count: 1
            }
          ];
        }
      }

      if (this.operation === 'select') {
        let results = [...stored];
        for (const f of this.filters) {
          if (f.op === 'eq') {
            results = results.filter((item: any) => String(item[f.field]) === String(f.value));
          } else if (f.op === 'ilike') {
            const val = String(f.value).toLowerCase().replace(/%/g, '');
            results = results.filter((item: any) => String(item[f.field] || '').toLowerCase().includes(val));
          }
        }
        return { data: results, error: null };
      }

      if (this.operation === 'insert' || this.operation === 'upsert') {
        const items = Array.isArray(this.payload) ? this.payload : [this.payload];
        for (const item of items) {
          const idx = stored.findIndex((x: any) => x.id && item.id && String(x.id) === String(item.id));
          if (idx >= 0) {
            stored[idx] = { ...stored[idx], ...item };
          } else {
            stored.push(item);
          }
        }
        try {
          localStorage.setItem(storageKey, JSON.stringify(stored));
        } catch {}
        return { data: items, error: null };
      }

      if (this.operation === 'update') {
        let updated = 0;
        stored = stored.map((item: any) => {
          let match = true;
          for (const f of this.filters) {
            if (f.op === 'eq' && String(item[f.field]) !== String(f.value)) {
              match = false;
            }
          }
          if (match) {
            updated++;
            return { ...item, ...this.payload };
          }
          return item;
        });
        try {
          localStorage.setItem(storageKey, JSON.stringify(stored));
        } catch {}
        return { data: { updated }, error: null };
      }

      if (this.operation === 'delete') {
        stored = stored.filter((item: any) => {
          for (const f of this.filters) {
            if (f.op === 'eq' && String(item[f.field]) === String(f.value)) {
              return false; // remove
            }
          }
          return true;
        });
        try {
          localStorage.setItem(storageKey, JSON.stringify(stored));
        } catch {}
        return { data: null, error: null };
      }

      return { data: stored, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }
}

const mockUser = {
  id: 'user-mock',
  email: 'latierritaapp@gmail.com',
  app_metadata: {},
  user_metadata: {
    name: 'Carlos Valencia',
    username: 'carlos_valencia',
    user_name: 'carlos_valencia',
    full_name: 'Carlos Valencia',
    first_name: 'Carlos',
    last_name: 'Valencia',
    birth_date: '1990-01-01',
    age: 34,
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    city: 'Madrid',
    origin_city: 'Medellín'
  },
  aud: 'authenticated',
  created_at: new Date().toISOString()
};

export const supabase = {
  from: (table: string) => new LocalSupabaseQueryBuilder(table),
  rpc: async (...args: any[]) => ({ data: null, error: null }),
  auth: {
    signUp: async (...args: any[]) => ({ data: { user: mockUser, session: { user: mockUser } }, error: null }),
    signInWithPassword: async (...args: any[]) => ({ data: { user: mockUser, session: { user: mockUser } }, error: null }),
    signInWithOAuth: async (...args: any[]) => ({ data: null, error: null }),
    signInWithOtp: async (...args: any[]) => ({ data: null, error: null }),
    resetPasswordForEmail: async (...args: any[]) => ({ data: null, error: null }),
    updateUser: async (...args: any[]) => ({ data: { user: mockUser }, error: null }),
    getUser: async (...args: any[]) => ({ data: { user: mockUser }, error: null }),
    signOut: async () => ({ error: null }),
    getSession: async () => ({ data: { session: { user: mockUser } }, error: null }),
    onAuthStateChange: (callback?: (event: string, session: any) => void) => {
      if (callback) {
        try { callback('INITIAL_SESSION', { user: mockUser }); } catch {}
      }
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  },
  channel: (name: string) => {
    const channelObj: any = {
      on: (event: string, filter: any, callback: (payload: any) => void) => {
        return channelObj;
      },
      subscribe: () => channelObj
    };
    return channelObj;
  },
  removeChannel: (channel: any) => {},
  removeChannels: () => {}
};
