# Dùng MongoDB Transaction trong PFM Backend

## Điều kiện để dùng Transaction

MongoDB **transactions** (`session.startTransaction()` / `commitTransaction` / `abortTransaction`) **chỉ hoạt động khi**:

1. **Replica set** – MongoDB chạy dưới dạng replica set (ít nhất 1 node, có thể single-node cho dev), **hoặc**
2. **Sharded cluster** – MongoDB chạy qua `mongos` (cluster sharded).

**Standalone** (một instance MongoDB không khai báo replica set) **không hỗ trợ** transactions → sẽ lỗi:  
`Transaction numbers are only allowed on a replica set member or mongos`.

---

## Cách chạy MongoDB dạng Replica Set (local / dev)

### 1. Cài MongoDB local (Windows / macOS / Linux)

- Cài bản Community từ [MongoDB Download](https://www.mongodb.com/try/download/community) hoặc qua package manager.

### 2. Cấu hình replica set (single node cho dev)

**Cách A – Dòng lệnh (nhanh cho dev):**

```bash
# Khởi động mongod với replica set (tên rs0)
mongod --replSet rs0 --port 27017 --dbpath /path/to/your/data
```

- `--dbpath`: thư mục chứa data (tùy OS, ví dụ Windows: `C:\data\db`, Linux/macOS: `/data/db` hoặc tạo thư mục bất kỳ).

**Cách B – File config (mongod.cfg):**

Thêm (hoặc sửa) trong `mongod.cfg`:

```yaml
replication:
  replSetName: "rs0"
```

Sau đó chạy: `mongod -f mongod.cfg` (hoặc `mongod --config mongod.cfg`).

### 3. Khởi tạo replica set (chỉ làm 1 lần)

Mở shell kết nối vào MongoDB (cùng host/port):

```bash
mongosh
# hoặc: mongo
```

Trong shell:

```javascript
rs.initiate()
```

Khi replica set đã PRIMARY, có thể kiểm tra:

```javascript
rs.status()
```

### 4. Kết nối từ ứng dụng

Chuỗi kết nối giữ nguyên (host/port), ví dụ:

```
mongodb://localhost:27017/your_database_name
```

Không cần thêm tham số đặc biệt; driver sẽ nhận diện replica set từ `ismaster`/`hello`.

---

## Docker – MongoDB replica set (1 node)

```bash
docker run -d --name mongors \
  -p 27017:27017 \
  mongo:7 --replSet rs0
```

Sau khi container chạy:

```bash
docker exec -it mongors mongosh --eval "rs.initiate()"
```

Ứng dụng kết nối: `mongodb://localhost:27017/your_database_name`.

---

## Bật Transaction trong code (PFM backend)

Backend đang có **hai chế độ**:

- **Mặc định (standalone):** không dùng `session.startTransaction()`, dùng thao tác thường + **rollback thủ công** trong `catch` khi lỗi (ví + transaction luôn nhất quán trong cùng request).
- **Khi có replica set:** có thể bật MongoDB transaction để dùng `session` + `startTransaction`/`commitTransaction`/`abortTransaction`.

### Bật chế độ Transaction (khi đã chạy replica set)

Trong `.env` (hoặc biến môi trường):

```env
USE_MONGODB_TRANSACTIONS=true
```

- `USE_MONGODB_TRANSACTIONS=true`: service transaction sẽ dùng **MongoDB session + transaction** (cần replica set).
- Không set hoặc `false`: dùng logic hiện tại (không session, rollback thủ công).

**Lưu ý:** Chỉ set `USE_MONGODB_TRANSACTIONS=true` khi MongoDB thực sự đang chạy replica set (hoặc mongos). Nếu vẫn là standalone, mọi request create/update/delete/duplicate transaction sẽ lỗi như trước.

---

## Tóm tắt

| Môi trường              | MongoDB chạy kiểu   | Nên dùng                         |
|-------------------------|---------------------|----------------------------------|
| Dev local (đơn giản)    | Standalone          | Không set env (rollback thủ công) |
| Dev local (giống prod)  | Replica set 1 node | `USE_MONGODB_TRANSACTIONS=true`  |
| Staging / Production    | Replica set / Atlas | `USE_MONGODB_TRANSACTIONS=true`  |

Nếu muốn dùng Transaction: đảm bảo MongoDB là **replica set** (hoặc cluster qua mongos), sau đó bật `USE_MONGODB_TRANSACTIONS=true` trong env.
