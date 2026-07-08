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
  SecurityLog: 'security_logs',
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
    update: async
