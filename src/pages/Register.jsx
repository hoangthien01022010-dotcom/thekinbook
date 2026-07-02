import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, Loader2, Eye, EyeOff, Sparkles, AlertCircle, CheckCircle } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!name.trim()) {
      setError("Vui lòng nhập tên");
      return;
    }
    if (!email.trim()) {
      setError("Vui lòng nhập email");
      return;
    }
    if (!validateEmail(email)) {
      setError("Email không hợp lệ");
      return;
    }
    if (!password.trim()) {
      setError("Vui lòng nhập mật khẩu");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    if (password !== confirmPw) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);
    try {
      const { data, error: err } = await authService.register(email, password, name);

      if (err) {
        console.error("[Register Error]", err);
        setError(err.message || "Đăng ký thất bại");
        return;
      }

      if (data) {
        console.log("[Register Success]", data.email);
        setSuccess("Đăng ký thành công! Đang chuyển hướng...");
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 1500);
      }
    } catch (err) {
      console.error("[Register Exception]", err);
      setError("Có lỗi xảy ra. Vui lòng thử lại");
    } finally {
      setLoading(false);
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
            <p className="mt-1.5 text-sm text-white/50">Tạo tài khoản mới</p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-300 text-sm flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-xs uppercase tracking-wider text-white/60">Tên</Label>
              <div className="relative mt-1.5">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  autoFocus
                  required
                  disabled={loading}
                  placeholder="Tên của bạn"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-violet-500 focus-visible:border-violet-500/50 disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-xs uppercase tracking-wider text-white/60">Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={loading}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-violet-500 focus-visible:border-violet-500/50 disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-xs uppercase tracking-wider text-white/60">Mật khẩu</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  disabled={loading}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 pr-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-violet-500 focus-visible:border-violet-500/50 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 disabled:opacity-50"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPw" className="text-xs uppercase tracking-wider text-white/60">Xác nhận mật khẩu</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  id="confirmPw"
                  type={showConfirmPw ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  disabled={loading}
                  placeholder="••••••••"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  className="pl-11 pr-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-violet-500 focus-visible:border-violet-500/50 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(v => !v)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 disabled:opacity-50"
                  tabIndex={-1}
                >
                  {showConfirmPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !name.trim() || !email.trim() || !password.trim() || !confirmPw.trim()}
              className="w-full h-12 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 shadow-lg shadow-violet-900/40 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang đăng ký...
                </>
              ) : (
                "Đăng ký"
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-white/50">
            Đã có tài khoản?{" "}
            <Link to="/login" className="text-white font-medium hover:text-violet-300">Đăng nhập</Link>
            <span className="mx-2 text-white/20">·</span>
            <Link to="/welcome" className="text-white/70 hover:text-white">Giới thiệu</Link>
          </p>
        </div>
      </div>
    </div>
  );
}