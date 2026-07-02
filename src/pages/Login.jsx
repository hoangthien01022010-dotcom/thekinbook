import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, Eye, EyeOff, Sparkles } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) throw err;
      navigate("/", { replace: true });
    } catch (err) {
      setError(err?.message || "Email hoặc mật khẩu không đúng");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/` },
      });
      if (err) throw err;
    } catch (err) {
      setError(err?.message || "Không thể đăng nhập với Google");
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-slate-950 flex items-center justify-center p-4">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-violet-600/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-md">
        <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-8 sm:p-10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-blue-500 blur-xl opacity-60" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 via-blue-500 to-cyan-400 flex items-center justify-center shadow-2xl">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="mt-5 text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              Kin Book
            </h1>
            <p className="mt-1.5 text-sm text-white/50">Chào mừng trở lại</p>
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            className="w-full h-12 rounded-xl bg-white hover:bg-white/95 text-slate-900 font-medium flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] shadow-lg"
          >
            <GoogleIcon className="w-5 h-5" />
            Tiếp tục với Google
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
            <div className="relative flex justify-center">
              <span className="bg-slate-950/60 backdrop-blur px-3 text-xs uppercase tracking-wider text-white/40">hoặc dùng email</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-xs uppercase tracking-wider text-white/60">Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  id="email" type="email" autoComplete="email" autoFocus required
                  placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-violet-500 focus-visible:border-violet-500/50"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs uppercase tracking-wider text-white/60">Mật khẩu</Label>
                <Link to="/forgot-password" className="text-xs text-violet-300 hover:text-violet-200">Quên?</Link>
              </div>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  id="password" type={showPw ? "text" : "password"} autoComplete="current-password" required
                  placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 pr-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-violet-500 focus-visible:border-violet-500/50"
                />
                <button
                  type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit" disabled={loading}
              className="w-full h-12 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 shadow-lg shadow-violet-900/40 transition-all active:scale-[0.99] disabled:opacity-60"
            >
              {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang đăng nhập...</>) : "Đăng nhập"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-white/50">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="text-white font-medium hover:text-violet-300">Đăng ký</Link>
            <span className="mx-2 text-white/20">·</span>
            <Link to="/welcome" className="text-white/70 hover:text-white">Giới thiệu</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
