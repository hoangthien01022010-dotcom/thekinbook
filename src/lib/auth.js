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

  // Login with Email/Password
  async login(email, password) {
    try {
      // Validate input
      if (!email || !password) {
        throw new Error('Email và mật khẩu không được để trống');
      }

      // Query user from database
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (error || !data) {
        throw new Error('Email không tồn tại');
      }

      // Check password (simple comparison - in production use bcrypt!)
      if (data.password !== this.hashPassword(password)) {
        throw new Error('Mật khẩu không đúng');
      }

      // Set user session
      const user = {
        id: data.id,
        email: data.email,
        name: data.name,
        avatar: data.avatar,
        createdAt: data.created_at,
      };
      this.setUser(user);
      return { data: user, error: null };
    } catch (error) {
      return { data: null, error: error };
    }
  },

  // Register new user
  async register(email, password, name) {
    try {
      if (!email || !password || !name) {
        throw new Error('Vui lòng điền đầy đủ thông tin');
      }

      if (password.length < 6) {
        throw new Error('Mật khẩu phải có ít nhất 6 ký tự');
      }

      // Check if user already exists
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (existing) {
        throw new Error('Email này đã được đăng ký');
      }

      // Create new user
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            email: email.toLowerCase().trim(),
            password: this.hashPassword(password),
            name: name.trim(),
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
          },
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Auto login after registration
      const user = {
        id: data.id,
        email: data.email,
        name: data.name,
        avatar: data.avatar,
        createdAt: data.created_at,
      };
      this.setUser(user);
      return { data: user, error: null };
    } catch (error) {
      return { data: null, error: error };
    }
  },

  // Logout
  logout() {
    this.setUser(null);
  },

  // Simple hash function (NOT for production!)
  // In production, use bcrypt or similar
  hashPassword(password) {
    return btoa(password); // Base64 encode - ONLY for demo!
  },

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
