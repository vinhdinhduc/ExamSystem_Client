# Online Exam System — Frontend

> **React 19 + TypeScript + Vite** | Redux Toolkit | React Router v7 | SCSS BEM

---

## Công nghệ sử dụng

| Công nghệ | Phiên bản |
|-----------|-----------|
| React | 19 |
| TypeScript | 5.9 |
| Vite | 8 |
| Redux Toolkit | 2.11 |
| React Router DOM | 7 |
| Axios | 1.13 |
| React Toastify | 11 |
| SASS/SCSS | 1.98 |
| React Hook Form | 7 |
| React Icons | 5 |

---

## Cài đặt & Chạy

```bash
npm install
npm run dev
```

Ứng dụng chạy tại: `http://localhost:5173`

### Biến môi trường

Tạo file `.env` tại root:

```env
VITE_API_BASE_URL=http://localhost:5082
```

---

## Cấu trúc thư mục

```
src/
├── api/
│   ├── axiosClient.ts          — Axios instance + interceptor tự động refresh token
│   └── services/               — Gọi API theo từng domain
│       ├── authService.ts
│       ├── userService.ts
│       └── roleService.ts
├── components/
│   ├── layout/                 — AppLayout, Sidebar, Header
│   └── ui/                     — Button, Card, Modal, ConfirmModal, Table, ...
├── features/                   — Redux slices (auth, exam, question, ...)
├── pages/
│   ├── Login/                  — Đăng nhập
│   ├── Register/               — Đăng ký
│   ├── ForgotPassword/         — Quên mật khẩu
│   ├── ResetPassword/          — Đặt lại mật khẩu
│   ├── VerifyEmail/            — Xác thực email
│   ├── Dashboard/              — Trang chủ sau đăng nhập
│   ├── Admin/
│   │   └── RolesPermissionsPage — Quản lý Roles, Permissions, Users
│   ├── ExamList/               — Danh sách bài thi
│   ├── ExamDetail/             — Chi tiết bài thi
│   ├── ExamBuilder/            — Tạo/chỉnh sửa bài thi
│   ├── DoExam/                 — Làm bài thi
│   ├── Result/                 — Kết quả
│   ├── GroupManagement/        — Quản lý nhóm
│   └── SubjectManagement/      — Quản lý môn học
├── routes/
│   └── AppRoutes.tsx           — Khai báo routes + PrivateRoute guard
├── styles/                     — SCSS theo BEM methodology
├── types/                      — TypeScript type definitions
└── utils/                      — jwt, storage, authEvents helpers
```

---

## Tính năng đã hoàn thành

### Xác thực (Authentication)

| Tính năng | Trạng thái |
|-----------|-----------|
| Trang Login | ✅ |
| Trang Register | ✅ |
| Trang Quên mật khẩu | ✅ |
| Trang Đặt lại mật khẩu | ✅ |
| Trang Xác thực email | ✅ |
| Lưu access token vào localStorage | ✅ |
| Lưu thông tin user vào Redux + persist | ✅ |
| Tự động refresh token khi sắp hết hạn | ✅ |
| Tự động refresh khi nhận 401 | ✅ |
| Auto logout khi refresh thất bại | ✅ |
| Skip refresh logic cho `/auth/` endpoints | ✅ |

### Phân quyền & Route Guard

| Tính năng | Trạng thái |
|-----------|-----------|
| `PrivateRoute` — redirect về Login nếu chưa đăng nhập | ✅ |
| Route guard theo role | ✅ |
| Chỉ Admin mới truy cập được trang Roles & Permissions | ✅ |

### Trang quản lý Roles & Permissions (Admin)

| Tính năng | Trạng thái |
|-----------|-----------|
| Tab Roles — xem danh sách | ✅ |
| Tab Roles — tạo mới | ✅ |
| Tab Roles — chỉnh sửa | ✅ |
| Tab Roles — xóa (có confirm modal) | ✅ |
| Tab Roles — gán / thu hồi permissions | ✅ |
| Tab Permissions — xem danh sách | ✅ |
| Tab Permissions — tạo mới | ✅ |
| Tab Permissions — chỉnh sửa | ✅ |
| Tab Permissions — xóa (có confirm modal) | ✅ |
| Tab Users — xem danh sách + phân trang | ✅ |
| Tab Users — gán / thay đổi roles | ✅ |
| Tab Users — khóa / mở khóa tài khoản (có confirm modal) | ✅ |

### UI Components

| Component | Mô tả |
|-----------|-------|
| `Button` | 5 variants: primary, secondary, outline, danger, ghost |
| `Modal` | Modal chung với backdrop blur |
| `ConfirmModal` | Modal xác nhận hành động nguy hiểm (thay thế `confirm()`) |
| `Table` | Bảng dữ liệu generic với render tùy chỉnh theo cột |
| `Card` | Container với tiêu đề |
| `Toast` | Thông báo qua `react-toastify` |

---

## Luồng xác thực (Auth Flow)

```
1. Đăng nhập / Đăng ký
   └─ Lưu access_token → localStorage
   └─ Lưu user info → Redux (persist)
   └─ refresh_token → HttpOnly Cookie (tự động bởi browser)

2. Request API thông thường
   └─ axiosClient tự gắn: Authorization: Bearer {token}

3. Token sắp hết hạn (< 60s còn lại)
   └─ Proactive refresh: gọi /auth/refresh ngầm, không block request

4. Token đã hết hạn
   └─ Refresh ngay, chờ refresh xong rồi tiếp tục request gốc

5. Refresh thất bại
   └─ Xóa auth khỏi storage
   └─ Trigger auto logout → redirect về Login
```

---

## Cơ chế Token Refresh

File: [src/api/axiosClient.ts](src/api/axiosClient.ts)

- **Request interceptor:** Kiểm tra token trước mỗi request
  - Token hết hạn → refresh trước, block request chờ
  - Token sắp hết hạn → refresh ngầm, không block
  - Endpoint `/auth/*` → bỏ qua, không can thiệp
- **Response interceptor:** Xử lý 401 từ server
  - Thử refresh một lần rồi retry request gốc
  - Endpoint `/auth/*` → không retry (tránh loop)
- **Queue:** Nhiều request đồng thời khi đang refresh → xếp hàng chờ, dùng chung token mới

---

## Quản lý State (Redux Toolkit)

| Slice | Dữ liệu quản lý |
|-------|----------------|
| `authSlice` | user, token, trạng thái đăng nhập |
| `examSlice` | danh sách bài thi, bài thi đang chọn |
| `questionSlice` | câu hỏi, bộ câu hỏi |

State được persist qua `redux-persist` (localStorage).

---

**Cập nhật:** 17/03/2026 | **Phiên bản:** v2.0
