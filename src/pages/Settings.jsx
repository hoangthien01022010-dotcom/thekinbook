import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { ArrowLeft, User, Info, ShieldCheck, Palette, Camera, Loader2, LogOut, KeyRound, Sun, Moon } from 'lucide-react';
import Avatar from '@/components/chat/Avatar';
import CropModal from '@/components/CropModal';
import { readFileAsDataURL } from '@/lib/cropImage';
import { useTheme } from '@/lib/ThemeContext';

const TABS = [
  { id: 'ho_so', label: 'Hồ sơ', icon: User },
  { id: 'thong_tin', label: 'Thông tin', icon: Info },
  { id: 'bao_mat', label: 'Bảo mật', icon: ShieldCheck },
  { id: 'giao_dien', label: 'Giao diện', icon: Palette },
];

const PHONE_RE = /^0\d{9}$/;
function ageFrom(dateStr) {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a;
}

function Card({ children, className = '' }) {
  return <div className={`bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200/70 dark:border-gray-800 p-5 sm:p-6 ${className}`}>{children}</div>;
}
function Row({ label, children, hint }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  );
}
const inputCls = 'w-full h-11 px-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm dark:text-white outline-none focus:border-violet-500';

export default function Settings() {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const activeTab = TABS.find(t => t.id === sp.get('tab'))?.id || 'ho_so';
  const setTab = (id) => setSp({ tab: id });
  const { theme, toggleTheme } = useTheme();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const [cropAspect, setCropAspect] = useState(1);
  const [cropTarget, setCropTarget] = useState(null); // 'avatar' | 'cover'
  const [newPw, setNewPw] = useState('');
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        const ps = await base44.entities.UserProfile.filter({ user_id: me.id });
        const p = ps[0];
        if (p) {
          setProfile(p);
          setForm({
            display_name: p.display_name || '',
            username: p.username || '',
            bio: p.bio || '',
            birthday: p.birthday || '',
            gender: p.gender || '',
            phone: p.phone || '',
            location: p.location || '',
            hide_email: !!p.hide_email,
            hide_birthday: !!p.hide_birthday,
            allow_stranger_msg: p.allow_stranger_msg !== false,
          });
        }
      } catch {
        navigate('/login');
      }
    })();
  }, [navigate]);

  const pickFile = (target, aspect) => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = async (e) => {
      const f = e.target.files?.[0]; if (!f) return;
      const src = await readFileAsDataURL(f);
      setCropTarget(target); setCropAspect(aspect); setCropSrc(src);
    };
    inp.click();
  };

  const handleCropDone = async (file) => {
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const field = cropTarget === 'avatar' ? 'avatar_url' : 'cover_url';
      await base44.entities.UserProfile.update(profile.id, { [field]: file_url });
      setProfile((p) => ({ ...p, [field]: file_url }));
      toast.success(cropTarget === 'avatar' ? 'Đã cập nhật ảnh đại diện' : 'Đã cập nhật ảnh bìa');
    } catch (e) {
      toast.error('Tải ảnh lên thất bại');
    } finally {
      setCropSrc(null); setCropTarget(null);
    }
  };

  const saveProfile = async () => {
    if (!profile) return;
    if (form.bio && form.bio.length > 160) return toast.error('Tiểu sử tối đa 160 ký tự');
    if (form.username && !/^[a-z0-9_]{3,20}$/.test(form.username)) return toast.error('Tên tài khoản chỉ chứa chữ thường, số, gạch dưới (3–20 ký tự)');
    if (form.username && form.username !== profile.username) {
      const dup = await base44.entities.UserProfile.filter({ username: form.username });
      if (dup.some(x => x.id !== profile.id)) return toast.error('Tên tài khoản đã tồn tại');
    }
    if (form.phone && !PHONE_RE.test(form.phone)) return toast.error('Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)');
    if (form.birthday && ageFrom(form.birthday) < 13) return toast.error('Bạn phải đủ 13 tuổi trở lên');
    setSaving(true);
    try {
      const patch = { ...form };
      if (!patch.birthday) delete patch.birthday;
      const updated = await base44.entities.UserProfile.update(profile.id, patch);
      setProfile((p) => ({ ...p, ...updated }));
      toast.success('Đã lưu thay đổi');
    } catch (e) {
      toast.error(e?.message || 'Lưu thất bại');
    } finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (!newPw || newPw.length < 6) return toast.error('Mật khẩu mới cần ít nhất 6 ký tự');
    setPwBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      toast.success('Đã đổi mật khẩu');
      setNewPw('');
    } catch (e) { toast.error(e?.message || 'Đổi mật khẩu thất bại'); }
    finally { setPwBusy(false); }
  };

  const signOutAll = async () => {
    try { await supabase.auth.signOut({ scope: 'global' }); } catch {}
    window.location.href = '/login';
  };

  if (!profile) return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <Loader2 className="animate-spin text-violet-500" />
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-gray-50 dark:bg-gray-950 pb-24">
      <header className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-3xl mx-auto flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeft size={20} className="dark:text-gray-200"/>
          </button>
          <h1 className="text-lg font-bold dark:text-white">Cài đặt</h1>
        </div>
        <nav className="max-w-3xl mx-auto flex px-2 overflow-x-auto no-scrollbar">
          {TABS.map(t => {
            const Ic = t.icon; const active = activeTab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 h-11 text-sm font-medium border-b-2 transition-colors ${active
                  ? 'border-violet-600 text-violet-600 dark:text-violet-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}>
                <Ic size={16}/>{t.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-6 space-y-4">
        {activeTab === 'ho_so' && (
          <>
            <Card className="p-0 overflow-hidden">
              <div className="relative">
                <div className="h-40 sm:h-52 bg-gradient-to-br from-violet-500 to-blue-600 overflow-hidden">
                  {profile.cover_url && <img src={profile.cover_url} alt="cover" className="w-full h-full object-cover"/>}
                </div>
                <button onClick={() => pickFile('cover', 16/9)} className="absolute top-3 right-3 h-9 px-3 rounded-full bg-black/50 text-white text-xs font-medium flex items-center gap-1.5 hover:bg-black/70">
                  <Camera size={14}/>Đổi ảnh bìa
                </button>
                <div className="absolute -bottom-10 left-5 flex items-end gap-3">
                  <div className="relative rounded-full ring-4 ring-white dark:ring-gray-900">
                    <Avatar src={profile.avatar_url} name={profile.display_name} size={92}/>
                    <button onClick={() => pickFile('avatar', 1)} className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-lg hover:bg-violet-700">
                      <Camera size={15}/>
                    </button>
                  </div>
                </div>
              </div>
              <div className="pt-14 px-5 pb-5" />
            </Card>

            <Card className="space-y-5">
              <Row label="Tên hiển thị">
                <input className={inputCls} value={form.display_name} onChange={(e) => setForm(f => ({ ...f, display_name: e.target.value }))} placeholder="Nguyễn Văn A"/>
              </Row>
              <Row label="Tên tài khoản" hint="Chữ thường, số, gạch dưới. 3–20 ký tự.">
                <div className="flex items-center gap-1">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">@</span>
                  <input className={inputCls} value={form.username} onChange={(e) => setForm(f => ({ ...f, username: e.target.value.toLowerCase().trim() }))} placeholder="username"/>
                </div>
              </Row>
              <Row label={`Tiểu sử (${(form.bio || '').length}/160)`}>
                <textarea rows={3} maxLength={160} className={`${inputCls} h-auto py-2.5 resize-none`} value={form.bio} onChange={(e) => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Vài dòng về bạn…"/>
              </Row>
              <div className="flex justify-end">
                <button onClick={saveProfile} disabled={saving} className="h-11 px-5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-blue-600 shadow disabled:opacity-60">
                  {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
                </button>
              </div>
            </Card>
          </>
        )}

        {activeTab === 'thong_tin' && (
          <Card className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <Row label="Ngày sinh" hint="Bạn phải đủ 13 tuổi.">
                <input type="date" className={inputCls} value={form.birthday || ''} onChange={(e) => setForm(f => ({ ...f, birthday: e.target.value }))}/>
              </Row>
              <Row label="Giới tính">
                <select className={inputCls} value={form.gender || ''} onChange={(e) => setForm(f => ({ ...f, gender: e.target.value }))}>
                  <option value="">— Chọn —</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </Row>
              <Row label="Số điện thoại" hint="Định dạng VN: bắt đầu bằng 0, 10 số.">
                <input inputMode="tel" className={inputCls} value={form.phone || ''} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value.trim() }))} placeholder="0901234567"/>
              </Row>
              <Row label="Địa điểm">
                <input className={inputCls} value={form.location || ''} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Hà Nội"/>
              </Row>
            </div>
            <div className="flex justify-end">
              <button onClick={saveProfile} disabled={saving} className="h-11 px-5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-blue-600 shadow disabled:opacity-60">
                {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
              </button>
            </div>
          </Card>
        )}

        {activeTab === 'bao_mat' && (
          <div className="space-y-4">
            <Card className="space-y-4">
              <Row label="Email">
                <input readOnly value={user?.email || ''} className={`${inputCls} bg-gray-100 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 cursor-not-allowed`}/>
              </Row>
              <Row label="Đổi mật khẩu">
                <div className="flex gap-2">
                  <input type="password" className={inputCls} placeholder="Mật khẩu mới (≥ 6 ký tự)" value={newPw} onChange={(e) => setNewPw(e.target.value)}/>
                  <button onClick={changePassword} disabled={pwBusy} className="shrink-0 h-11 px-4 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 flex items-center gap-1.5 disabled:opacity-60">
                    <KeyRound size={16}/>{pwBusy ? '…' : 'Đổi'}
                  </button>
                </div>
              </Row>
            </Card>

            <Card className="space-y-3">
              <button onClick={signOutAll} className="w-full h-11 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-950/50">
                <LogOut size={16}/>Đăng xuất khỏi tất cả thiết bị
              </button>
              <button onClick={() => toast('Sắp ra mắt', { description: 'Tính năng liên kết Google đang được hoàn thiện.' })} className="w-full h-11 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-700">
                Liên kết tài khoản Google
              </button>
            </Card>
          </div>
        )}

        {activeTab === 'giao_dien' && (
          <Card className="space-y-2">
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? <Moon size={18} className="text-violet-400"/> : <Sun size={18} className="text-amber-500"/>}
                <div>
                  <p className="font-medium dark:text-white text-sm">Chế độ tối</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Dễ nhìn hơn vào ban đêm</p>
                </div>
              </div>
              <button onClick={toggleTheme} className={`w-11 h-6 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-violet-600' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${theme === 'dark' ? 'translate-x-5' : ''}`}/>
              </button>
            </div>

            {[
              { key: 'hide_email', label: 'Ẩn email khỏi hồ sơ công khai' },
              { key: 'hide_birthday', label: 'Ẩn ngày sinh khỏi hồ sơ công khai' },
              { key: 'allow_stranger_msg', label: 'Cho phép người lạ nhắn tin' },
            ].map((it) => (
              <div key={it.key} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <p className="text-sm dark:text-white">{it.label}</p>
                <button onClick={async () => {
                  const v = !form[it.key];
                  setForm(f => ({ ...f, [it.key]: v }));
                  try { await base44.entities.UserProfile.update(profile.id, { [it.key]: v }); }
                  catch { toast.error('Không lưu được'); setForm(f => ({ ...f, [it.key]: !v })); }
                }} className={`w-11 h-6 rounded-full relative transition-colors ${form[it.key] ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-700'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form[it.key] ? 'translate-x-5' : ''}`}/>
                </button>
              </div>
            ))}
          </Card>
        )}
      </main>

      {cropSrc && (
        <CropModal image={cropSrc} aspect={cropAspect} title={cropTarget === 'avatar' ? 'Cắt ảnh đại diện' : 'Cắt ảnh bìa'} onCancel={() => setCropSrc(null)} onDone={handleCropDone}/>
      )}
    </div>
  );
}
