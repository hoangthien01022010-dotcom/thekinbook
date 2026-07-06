import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Lock, Loader2, Eye, EyeOff, Sparkles, AlertCircle } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!identifier.trim()) return setError("Nhập tên đăng nhập");
    if (!password) return setError("Nhập mật khẩu");
    setLoading(true);
    try {
      const { data, error: err } = await authService.login(identifier, password);
      if (err) { setError(err.message || "Đăng nhập thất bại"); return; }
      if (data) navigate("/", { replace: true });
    } catch {
      setError("Có lỗi xảy ra. Thử lại");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-pink-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative w-full max-w-md">
        <div className="glass-strong rounded-3xl p-8 sm:p-10">
          <div className="flex flex-col items-center mb-8">
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-pink-500 flex items-center justify-center shadow-[0_0_40px_rgba(53,234,255,0.35)]">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="mt-5 text-3xl font-bold tracking-tight">Kin Book</h1>
            <p className="mt-1.5 text-sm text-white/50">Chào mừng trở lại</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5" /><span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="id" className="text-xs uppercase tracking-wider text-white/60">Tên đăng nhập</Label>
              <div className="relative mt-1.5">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input id="id" autoFocus autoComplete="username" disabled={loading}
                  placeholder="ten_dang_nhap hoặc email"
                  value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                  className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs uppercase tracking-wider text-white/60">Mật khẩu</Label>
                <Link to="/forgot-password" className="text-xs text-cyan-300 hover:text-cyan-200">Quên?</Link>
              </div>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input id="password" type={showPw ? "text" : "password"} autoComplete="current-password"
                  disabled={loading} placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 pr-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30" />
                <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading || !identifier.trim() || !password}
              className="neon-btn w-full h-12 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Đăng nhập"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/50">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="text-white font-medium hover:text-cyan-300">Đăng ký</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
