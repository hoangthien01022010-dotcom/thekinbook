import { supabase } from './supabaseClient';

const AUTH_KEY = 'kinbook_auth';

const USERNAME_RE = /^[a-z0-9_]{3,30}$/;

function normId(id) {
  return String(id || '').toLowerCase().trim();
}

function isEmail(id) {
  return /.+@.+\..+/.test(id);
}

function toAuthEmail(identifier) {
  const id = normId(identifier);
  if (isEmail(id)) return id;
  if (!USERNAME_RE.test(id)) {
    throw new Error('Tên đăng nhập chỉ dùng chữ thường, số, gạch dưới (3–30 ký tự)');
  }
  return `${id}@kinbook.local`;
}

function publicUser(sessionUser) {
  if (!sessionUser) return null;
  const username = sessionUser.user_metadata?.username || '';
  return {
    id: sessionUser.id,
    email: sessionUser.email,
    username,
    name: sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.display_name || username || sessionUser.email?.split('@')[0],
    avatar: sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture || '',
    createdAt: sessionUser.created_at,
  };
}

async function ensureProfile(sessionUser, fallback = {}) {
  if (!sessionUser?.id) return;
  const username = fallback.username || sessionUser.user_metadata?.username || '';
  const displayName = fallback.name || sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.display_name || sessionUser.email?.split('@')[0] || 'Người dùng';

  await supabase
    .from('user_profiles')
    .upsert({
      user_id: sessionUser.id,
      email: sessionUser.email,
      display_name: displayName,
      username: username || null,
      avatar_url: sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture || '',
      is_online: true,
      last_active: new Date().toISOString(),
    }, { onConflict: 'user_id' });
}

export const authService = {
  setUser(user) {
    if (user) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
  },

  getUser() {
    const data = localStorage.getItem(AUTH_KEY);
    return data ? JSON.parse(data) : null;
  },

  isAuthenticated() {
    return !!this.getUser();
  },

  normId,

  async login(identifier, password) {
    try {
      const id = normId(identifier);
      if (!id || !password) throw new Error('Tên đăng nhập và mật khẩu không được để trống');
      const email = toAuthEmail(id);

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        const message = error.message?.toLowerCase().includes('invalid')
          ? 'Tên đăng nhập hoặc mật khẩu không đúng'
          : error.message;
        throw new Error(message || 'Đăng nhập thất bại');
      }

      await ensureProfile(data.user, { username: isEmail(id) ? data.user?.user_metadata?.username : id });
      const user = publicUser(data.user);
      this.setUser(user);
      return { data: user, error: null };
    } catch (error) { return { data: null, error }; }
  },

  async register(identifier, password, name) {
    try {
      const id = normId(identifier);
      if (!id || !password || !name) throw new Error('Vui lòng điền đầy đủ thông tin');
      if (password.length < 4) throw new Error('Mật khẩu tối thiểu 4 ký tự');
      const email = toAuthEmail(id);
      const username = isEmail(id) ? id.split('@')[0].replace(/[^a-z0-9_]/g, '_').slice(0, 30) : id;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: name.trim(),
            display_name: name.trim(),
            username,
          },
        },
      });
      if (error) {
        const msg = error.message?.toLowerCase().includes('already') ? 'Tên đăng nhập này đã tồn tại' : error.message;
        throw new Error(msg || 'Đăng ký thất bại');
      }

      let sessionUser = data.user;
      if (!data.session) {
        const signedIn = await supabase.auth.signInWithPassword({ email, password });
        if (signedIn.error) throw signedIn.error;
        sessionUser = signedIn.data.user;
      }

      await ensureProfile(sessionUser, { username, name: name.trim() });
      const user = publicUser(sessionUser);
      this.setUser(user);
      return { data: user, error: null };
    } catch (error) { return { data: null, error }; }
  },

  async resetPassword(identifier, newPassword) {
    try {
      const id = this.normId(identifier);
      if (!id || !newPassword) throw new Error('Thiếu thông tin');
      if (newPassword.length < 4) throw new Error('Mật khẩu tối thiểu 4 ký tự');
      const email = toAuthEmail(id);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      return { data: true, error: null };
    } catch (error) { return { data: null, error }; }
  },

  logout() {
    this.setUser(null);
    return supabase.auth.signOut();
  },

  async updateProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      const user = this.getUser();
      this.setUser({ ...user, ...data });
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
};
