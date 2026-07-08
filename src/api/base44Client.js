// Drop-in adapter that replaces the legacy base44 SDK with Supabase + Lovable AI.
// Every base44.* call in the codebase resolves through here.
import { supabase } from '@/lib/supabaseClient';
import { lovable } from '@/integrations/lovable/index';

// ---------------------------------------------------------------------------
// Table name mapping (entity name -> Postgres table)
// ---------------------------------------------------------------------------
const TABLE = {
  UserProfile: 'user_profiles',
  Conversation: 'conversations',
  Message: 'messages',
  Friendship: 'friendships',
  FriendRequest: 'friendships',
  Notification: 'notifications',
  CallRoom: 'call_rooms',
  AISettings: 'ai_settings',
  Report: 'reports',
  Post: 'posts',
};

// ---------------------------------------------------------------------------
// Helper: convert a base44-style order string ("-created_date") to supabase
// ---------------------------------------------------------------------------
function applyOrder(query, order) {
  if (!order) return query;
  const ascending = !order.startsWith('-');
  const column = order.replace(/^-/, '');
  return query.order(column, { ascending });
}

function makeEntity(name) {
  const table = TABLE[name];
  if (!table) throw new Error(`Unknown entity: ${name}`);

  const listeners = new Set();
  // Lazy realtime channel per table
  let channel = null;
  const ensureChannel = () => {
    if (channel) return;
    channel = supabase
      .channel(`rt-${table}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          listeners.forEach((cb) => {
            try {
              cb({
                type: payload.eventType,
                data: payload.new || payload.old,
              });
            } catch (e) {
              console.error(e);
            }
          });
        },
      )
      .subscribe();
  };

  return {
    list: async (order = '-created_date', limit = 500) => {
      let q = supabase.from(table).select('*');
      q = applyOrder(q, order);
      q = q.limit(limit);
      const { data, error } = await q;
      if (error) {
        console.error(`[${table}] list error:`, error);
        return [];
      }
      return data || [];
    },
    get: async (id) => {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) {
        console.error(`[${table}] get error:`, error);
        return null;
      }
      return data;
    },
    filter: async (where = {}, order, limit = 500) => {
      let q = supabase.from(table).select('*');
      for (const [k, v] of Object.entries(where)) {
        if (v === null || v === undefined) continue;
        q = q.eq(k, v);
      }
      if (order) q = applyOrder(q, order);
      q = q.limit(limit);
      const { data, error } = await q;
      if (error) {
        console.error(`[${table}] filter error:`, error);
        return [];
      }
      return data || [];
    },
    create: async (obj) => {
      const { data, error } = await supabase
        .from(table)
        .insert(obj)
        .select()
        .single();
      if (error) {
        console.error(`[${table}] create error:`, error);
        throw error;
      }
      return data;
    },
    update: async (id, obj) => {
      const { data, error } = await supabase
        .from(table)
        .update(obj)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        console.error(`[${table}] update error:`, error);
        throw error;
      }
      return data;
    },
    delete: async (id) => {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      return true;
    },
    subscribe: (cb) => {
      ensureChannel();
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
  };
}

const entities = new Proxy(
  {},
  {
    get: (cache, name) => {
      if (!TABLE[name]) return undefined;
      if (!cache[name]) cache[name] = makeEntity(name);
      return cache[name];
    },
  },
);

// ---------------------------------------------------------------------------
// auth namespace (replaces base44.auth.*)
// ---------------------------------------------------------------------------
const auth = {
  me: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw Object.assign(new Error('Not authenticated'), { status: 401 });
    return {
      id: data.user.id,
      email: data.user.email,
      full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
    };
  },
  loginViaEmailPassword: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },
  signUpViaEmailPassword: async (email, password) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
  },
  loginWithProvider: async (provider, redirect = '/') => {
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
      extraParams: provider === 'google' ? { prompt: 'select_account' } : undefined,
    });
    if (result?.error) throw result.error;
    if (!result?.redirected && redirect) window.location.href = redirect;
  },
  logout: async (redirect) => {
    await supabase.auth.signOut();
    if (redirect) window.location.href = redirect;
  },
  redirectToLogin: () => {
    window.location.href = '/login';
  },
  resetPasswordRequest: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    });
    if (error) throw error;
  },
  updatePassword: async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },
};

// ---------------------------------------------------------------------------
// integrations namespace
//   - Core.InvokeLLM -> Lovable AI via edge function
//   - Core.UploadFile -> Supabase Storage (bucket: 'uploads')
// ---------------------------------------------------------------------------
async function invokeAIChat({ prompt, messages, system, max_tokens, model }) {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({ prompt, messages, system, max_tokens, model }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI error: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.text || data.response || '';
}

async function uploadFile({ file, onProgress }) {
  if (!file) throw new Error('No file');
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
  const path = `${crypto.randomUUID()}.${ext}`;

  // Use signed upload URL + XHR so we can report progress.
  const { data: signed, error: signedErr } = await supabase
    .storage.from('uploads').createSignedUploadUrl(path);

  if (signedErr || !signed?.signedUrl) {
    // Fallback: direct upload without progress.
    const { error } = await supabase.storage.from('uploads').upload(path, file, {
      cacheControl: '3600', upsert: false, contentType: file.type || undefined,
    });
    if (error) throw error;
  } else {
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', signed.signedUrl, true);
      if (file.type) xhr.setRequestHeader('Content-Type', file.type);
      xhr.setRequestHeader('x-upsert', 'false');
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable && typeof onProgress === 'function') {
          onProgress(Math.round((ev.loaded / ev.total) * 100));
        }
      };
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300) ? resolve() : reject(new Error(`Upload failed: ${xhr.status} ${xhr.responseText}`));
      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.send(file);
    });
  }

  // Bucket is private — issue a long-lived signed URL (10 years).
  const { data, error: urlErr } = await supabase.storage
    .from('uploads')
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (urlErr) throw urlErr;
  if (typeof onProgress === 'function') onProgress(100);
  return { file_url: data.signedUrl };
}

const integrations = {
  Core: {
    InvokeLLM: (args) => invokeAIChat(args),
    UploadFile: (args) => uploadFile(args),
  },
};

// Functions namespace (legacy no-op for any remaining call sites)
const functions = { invoke: async () => ({ ok: true }) };

export const base44 = { auth, entities, integrations, functions };
export default base44;
