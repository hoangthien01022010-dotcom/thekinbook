## Kế hoạch triển khai (chia 4 giai đoạn)

Scope quá lớn để làm 1 lượt — mình sẽ chia thành 4 PR nhỏ, làm tuần tự và bạn duyệt từng bước. Bắt đầu từ P1 (lỗi UI gấp) trước, các phần sau làm khi bạn OK.

---

### P1 — Fix contrast light mode + khôi phục nút bị mất  *(làm ngay)*

- Rà lại `src/index.css`: các rule `.light h1..h4`, `.light label`, `.light p`, `.light .text-muted-foreground`, `.light button` — đổi màu chữ về `hsl(222 47% 11%)` (đen mềm), muted về `hsl(222 20% 35%)`.
- Kiểm tra `.auth-shell` không leak style xám sang trang chính khi ở light mode.
- Rà `Home.jsx`, `Settings.jsx`, `Profile.jsx`, sidebar chat: khôi phục các `<button>` / tab bị `opacity-0` hoặc `text-white/5` do ép dark theme. Đảm bảo tab bar dưới cùng (Cộng đồng / Chat / Bạn bè / Thông báo / Cài đặt) hiện đầy đủ ở cả 2 theme.
- Test bằng Playwright: chụp home ở light + dark, so sánh có đủ nút.

### P2 — Cộng đồng kiểu "Server chat" *(sau khi P1 OK)*

- Thêm bảng `community_channels` (id, name, icon, description, position) + `community_messages` (channel_id, user_id, content, attachment_url, created_at) với RLS + realtime.
- Layout 3 cột (desktop) / drawer (mobile):
  - Cột trái: danh sách kênh (# general, # game, # ảnh, # thông báo…) + nút tạo kênh (admin).
  - Cột giữa: khung chat realtime, gõ tin nhắn, emoji, gửi ảnh.
  - Cột phải: danh sách thành viên online.
- Nền glass teal/pink giống theme hiện tại, chuyển động subtle (fade khi tin nhắn mới).
- Giữ tab "Bảng feed" cũ chuyển sang mục "Bài đăng" riêng (không xoá dữ liệu).

### P3 — AI Hacker bảo mật + Admin GitHub *(sau P2)*

Trong `AdminPanel.jsx` thêm 2 tab mới:

**Tab "AI Bảo mật":**
- Edge function `security-monitor`: đọc `security_logs`, đếm request/phút theo IP + user, phát hiện spike/spam, trả về cảnh báo.
- Ô chat với AI (Lovable AI `google/gemini-2.5-flash`) — system prompt: "Bạn là AI bảo mật KinBook, phân tích log, đề xuất chặn, giải thích tấn công". Admin gõ lệnh → AI đọc log gần nhất + trả lời.
- Cron `pg_cron` mỗi 5 phút chạy `security-monitor` → nếu bất thường tạo `notification` cho admin.
- Rate-limit cứng ở edge function: > 60 req/phút/IP → trả 429 + ghi log.

**Tab "GitHub":**
- Nhập GitHub Personal Access Token (lưu vào `add_secret GITHUB_TOKEN`).
- Edge function `github-proxy`: liệt kê repo, xem commit gần nhất, xem issue, tạo issue.
- AI có thể gọi `github-proxy` để đọc code repo và gợi ý fix.

### P4 — Kiếm tiền qua autocard365.com *(sau P3)*

- Cần bạn cung cấp: API key autocard365, doc endpoint (nạp thẻ cào → quy đổi credit).
- Tạo bảng `wallet_transactions` (user_id, amount, card_serial, card_pin, status, provider_response).
- Edge function `autocard-charge`: nhận serial/pin → gọi autocard365 → cộng credit vào ví.
- Trang `/wallet`: nạp thẻ, xem lịch sử, đổi credit sang chức năng premium (AI không giới hạn, tick xanh, badge…).
- Cần bạn quyết: 1 credit = bao nhiêu VNĐ, dùng để mua gì.

---

### Thứ tự thực hiện

Mình bắt đầu **P1 ngay bây giờ** (fix chữ xám + khôi phục nút). Xong bạn kiểm tra → mình chuyển sang P2. Cứ vậy.

**Bạn cần chuẩn bị cho P3–P4:**
- GitHub Personal Access Token (P3)
- API key + doc autocard365.com (P4)
- Bảng giá credit (P4)

OK plan này chưa? Reply "ok P1" để mình bắt tay vào phần đầu.