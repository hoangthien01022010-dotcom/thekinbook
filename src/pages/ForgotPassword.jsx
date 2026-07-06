import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Lock, ArrowLeft, Loader2, AlertCircle, CheckCircle } from "lucide-react";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!identifier.trim()) return setError("Nhập tên đăng nhập của bạn");
    if (newPassword.length < 4) return setError("Mật khẩu tối thiểu 4 ký tự");
    if (newPassword !== confirm) return setError("Mật khẩu xác nhận không khớp");
    setLoading(true);
    const { error: err } = await authService.resetPassword(identifier, newPassword);
    setLoading(false);
    if (err) return setError(err.message || "Không thể đặt lại");
    setDone(true);
    setTimeout(() => navigate("/login", { replace: true }), 1200);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-strong rounded-3xl p-8">
        <h1 className="text-2xl font-bold text-center mb-1">Đặt lại mật khẩu</h1>
        <p className="text-center text-sm text-white/60 mb-6">Nhanh gọn — không cần email</p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5" /><span>{error}</span>
          </div>
        )}
        {done ? (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex gap-2">
            <CheckCircle className="w-4 h-4 mt-0.5" /><span>Đã cập nhật. Đang chuyển tới đăng nhập…</span>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-white/60">Tên đăng nhập / Email</Label>
              <div className="relative mt-1.5">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input value={identifier} onChange={e=>setIdentifier(e.target.value)} autoFocus
                  className="pl-11 h-12 bg-white/5 border-white/10" placeholder="ten_dang_nhap" />
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-white/60">Mật khẩu mới</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)}
                  className="pl-11 h-12 bg-white/5 border-white/10" placeholder="••••" />
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-white/60">Xác nhận</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)}
                  className="pl-11 h-12 bg-white/5 border-white/10" placeholder="••••" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="neon-btn w-full h-12">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Đặt lại mật khẩu"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-white/50">
          <Link to="/login" className="text-white/80 hover:text-white">
            <ArrowLeft className="w-3 h-3 inline mr-1" />Quay lại đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
