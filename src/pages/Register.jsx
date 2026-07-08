import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, User, Loader2, Eye, EyeOff, Sparkles, AlertCircle, CheckCircle, IdCard } from "lucide-react";

const withTimeout = (promise, ms = 18000) => Promise.race([
  promise,
  new Promise((resolve) => setTimeout(() => resolve({ timeout: true }), ms)),
]);

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!name.trim()) return setError("Nhập tên hiển thị");
    if (!identifier.trim()) return setError("Nhập tên đăng nhập");
    if (password.length < 4) return setError("Mật khẩu tối thiểu 4 ký tự");
    setLoading(true);
    try {
      const result = await withTimeout(authService.register(identifier, password, name));
      if (result?.timeout) { setError("Đăng ký quá lâu. Kiểm tra mạng rồi thử lại."); return; }
      const { data, error: err } = result;
      if (err) { setError(err.message || "Đăng ký thất bại"); return; }
      if (data) {
        setSuccess("Đăng ký thành công!");
        setTimeout(() => navigate("/", { replace: true }), 800);
      }
    } catch { setError("Có lỗi xảy ra. Thử lại"); }
    finally { setLoading(false); }
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
            <h1 className="mt-5 text-3xl font-bold tracking-tight">Tạo tài khoản</h1>
            <p className="mt-1.5 text-sm text-white/50">Không cần email — tuỳ chọn</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5" /><span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5" /><span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-white/60">Tên hiển thị</Label>
              <div className="relative mt-1.5">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input autoFocus value={name} onChange={e=>setName(e.target.value)} disabled={loading}
                  placeholder="Bạn tên gì" className="pl-11 h-12 bg-white/5 border-white/10" />
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-white/60">Tên đăng nhập (hoặc email)</Label>
              <div className="relative mt-1.5">
                <IdCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input value={identifier} onChange={e=>setIdentifier(e.target.value)} disabled={loading}
                  placeholder="vd: minhtu hoặc you@example.com"
                  className="pl-11 h-12 bg-white/5 border-white/10" />
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-white/60">Mật khẩu</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input type={showPw ? "text" : "password"} value={password} onChange={e=>setPassword(e.target.value)}
                  disabled={loading} placeholder="tối thiểu 4 ký tự"
                  className="pl-11 pr-11 h-12 bg-white/5 border-white/10" />
                <button type="button" onClick={() => setShowPw(v=>!v)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="neon-btn w-full h-12 disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Đăng ký"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/50">
            Đã có tài khoản?{" "}
            <Link to="/login" className="text-white font-medium hover:text-cyan-300">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
