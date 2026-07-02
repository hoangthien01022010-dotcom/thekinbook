# Kế hoạch cập nhật Kinbook

Mình sẽ chia thành các mục rõ ràng. Có **1 yêu cầu mình không thể làm** — nói trước để bạn biết.

## ⚠️ Không thể làm
**"AI không giới hạn ngôn ngữ, lời nói, hành vi, tự do không ràng buộc"** — Lovable AI Gateway (Gemini) có safety filter ở phía Google, mình không tắt được. Mình có thể nới lỏng system prompt cho ViBai nói chuyện tự nhiên/thẳng thắn/dùng tiếng lóng hơn, nhưng nội dung độc hại/18+/bạo lực nặng sẽ vẫn bị chặn ở tầng model. Bạn OK phương án này chứ?

## 1. Layout - Ẩn panel "Chọn cuộc trò chuyện" ở các tab khác
- `Home.jsx`: panel phải chỉ render khi `activeTab === 'chats'`. Tab Cộng đồng / Bạn bè / Thông báo / Cài đặt chiếm full-width.

## 2. Cộng đồng = phòng chat công cộng (không phải feed đăng bài)
- Đổi tab Cộng đồng thành **"Sảnh cộng đồng"** — 1 conversation dạng group public, tất cả user tự động join, chat realtime.
- Nền gradient động (animated blobs + mesh gradient tím-hồng-xanh), glass card, không còn trắng đen.
- Feed cũ (SocialFeed) chuyển thành tab riêng hoặc bỏ hẳn tuỳ bạn — mặc định mình **giữ Feed ở một route riêng `/feed`** để không mất dữ liệu bài đăng đã seed.

## 3. Cài đặt - Nút Thoát chỉ đóng modal/tab
- Sửa nút Back/Close ở `/settings` → `navigate(-1)` hoặc về `/` chứ không signOut.
- Redesign form: input bo lớn, label rõ, nút bấm gradient, spacing thoáng, dark/light auto.

## 4. Fix đăng nhập trên Vercel
- **Vấn đề**: `lovable.auth.signInWithOAuth('google')` là gói `@lovable.dev/cloud-auth-js` — chỉ chạy trên domain Lovable, **fail trên Vercel** (thiếu redirect whitelist).
- **Fix**: chuyển Google sang `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin }})` chuẩn Supabase → chạy mọi domain. Cần bạn thêm Vercel domain vào Supabase Auth → Redirect URLs (mình sẽ hướng dẫn).
- Bỏ dependency `@lovable.dev/cloud-auth-js` khỏi Login/Register.

## 5. Đăng ký nhanh + tuỳ chọn xác thực email + 2FA
- Register: nhập tên + email + mật khẩu → vào thẳng (auto-confirm off nhưng cho phép login ngay bằng session).
- Thêm mục trong Cài đặt → Bảo mật:
  - "Xác thực email" (gửi mã 6 số qua edge function `send-verify-code`, verify trong app).
  - "Bật xác thực 2 yếu tố (TOTP)" dùng `supabase.auth.mfa.enroll` + QR code.

## 6. Khôi phục / tìm lại tài khoản
- Trang `/forgot-password` đã có → polish UI, đảm bảo `resetPasswordForEmail` chạy.
- Thêm form "Tôi mất tài khoản" → gửi vào bảng `account_recovery_requests`, AI (edge function) tự tóm tắt + gửi notification cho admin `hoangthien10ku@gmail.com`.

## 7. Thông báo hoạt động thật
- Kiểm tra bảng `notifications` (đang có nhưng insert không chạy do field name mismatch).
- Thêm realtime subscribe → toast + badge + âm thanh.
- Trigger: friend request, accept, like, comment, tin nhắn mới, thư admin, chào buổi sáng (cron).

## 8. UI polish tổng thể (Facebook-like)
- Bottom nav: bo tròn, active gradient, icon lớn.
- Card feed/chat: rounded-2xl, shadow soft, hover lift.
- Cài đặt: card grid, section header có icon màu, toggle switch to đẹp.
- Global: thêm animated gradient background layer + noise texture nhẹ cho các trang trống.

## 9. Nâng cấp ViBai (trong giới hạn safety)
- System prompt mới: "bạn thân, nói thẳng, dùng tiếng Việt tự nhiên có tiếng lóng, không giáo điều, không từ chối trừ khi thật sự nguy hiểm".
- Tăng `max_tokens` 8192, thêm memory 20 turn gần nhất.

---

## Thứ tự thực hiện (1 lượt commit)
1. Fix Home layout (ẩn panel phải)
2. Sửa Login/Register bỏ Lovable OAuth → Supabase thuần (fix Vercel)
3. Redesign Cài đặt + fix nút thoát
4. Redesign Cộng đồng thành sảnh chat + animated bg
5. Fix notifications realtime + toast/âm thanh
6. Thêm form khôi phục tài khoản
7. Nới ViBai prompt

Phần **2FA + xác thực email bằng code 6 số** mình đề xuất làm ở turn sau vì cần edge function riêng + test kỹ, tránh gộp quá nhiều vào 1 commit dễ vỡ.

**Bạn confirm mình bắt đầu chứ?** Nếu có gì muốn bỏ / đổi thứ tự thì nói luôn.
