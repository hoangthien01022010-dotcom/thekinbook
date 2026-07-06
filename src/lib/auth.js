// Simple Auth System - No Supabase OAuth needed
import { supabase } from './supabaseClient';

const AUTH_KEY = 'kinbook_auth';

export const authService = {
  // Store user data locally
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

  // Normalize identifier (username OR email). Stored lowercase.
  normId(id) { return String(id || '').toLowerCase().trim(); },

  // Login with identifier (email or username) + password
  async login(identifier, password) {
    try {
      const id = this.normId(identifier);
      if (!id || !password) throw new Error('Tên đăng nhập và mật khẩu không được để trống');

      const { data, error } = await supabase
        .from('users').select('*').eq('email', id).maybeSingle();
      if (error || !data) throw new Error('Tài khoản không tồn tại');
      if (data.password !== this.hashPassword(password)) throw new Error('Mật khẩu không đúng');

      const user = { id: data.id, email: data.email, name: data.name, avatar: data.avatar, createdAt: data.created_at };
      this.setUser(user);
      return { data: user, error: null };
    } catch (error) { return { data: null, error }; }
  },

  // Register — email/username optional distinction; name required
  async register(identifier, password, name) {
    try {
      const id = this.normId(identifier);
      if (!id || !password || !name) throw new Error('Vui lòng điền đầy đủ thông tin');
      if (password.length < 4) throw new Error('Mật khẩu tối thiểu 4 ký tự');

      const { data: existing } = await supabase
        .from('users').select('id').eq('email', id).maybeSingle();
      if (existing) throw new Error('Tên đăng nhập này đã tồn tại');

      const { data, error } = await supabase.from('users').insert([{
        email: id,
        password: this.hashPassword(password),
        name: name.trim(),
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      }]).select().single();
      if (error) throw error;

      const user = { id: data.id, email: data.email, name: data.name, avatar: data.avatar, createdAt: data.created_at };
      this.setUser(user);
      return { data: user, error: null };
    } catch (error) { return { data: null, error }; }
  },

  // Simple direct reset — identifier + new password
  async resetPassword(identifier, newPassword) {
    try {
      const id = this.normId(identifier);
      if (!id || !newPassword) throw new Error('Thiếu thông tin');
      if (newPassword.length < 4) throw new Error('Mật khẩu tối thiểu 4 ký tự');
      const { data: existing } = await supabase.from('users').select('id').eq('email', id).maybeSingle();
      if (!existing) throw new Error('Tài khoản không tồn tại');
      const { error } = await supabase.from('users').update({ password: this.hashPassword(newPassword) }).eq('id', existing.id);
      if (error) throw error;
      return { data: true, error: null };
    } catch (error) { return { data: null, error }; }
  },

  logout() { this.setUser(null); },

  hashPassword(password) { return btoa(unescape(encodeURIComponent(password))); },

  // Update user profile
  async updateProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
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
