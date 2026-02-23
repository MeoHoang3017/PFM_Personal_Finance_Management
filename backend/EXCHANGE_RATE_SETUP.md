# Exchange Rate Auto-Update Setup Guide

## Tổng quan
Hệ thống tự động cập nhật tỷ giá hối đoái mỗi ngày từ các API provider và lưu vào database để sử dụng trong ứng dụng.

## Cài đặt Dependencies

Cài đặt các package cần thiết:

```bash
npm install axios node-cron
npm install --save-dev @types/node-cron
```

## Cấu hình Environment Variables

Thêm các biến sau vào file `.env`:

```env
# Exchange Rate API Configuration
# API Provider: exchangerate-api (free, no key needed), fixer, currencylayer
EXCHANGE_RATE_API_PROVIDER=exchangerate-api

# API Key (chỉ cần cho fixer và currencylayer, không cần cho exchangerate-api free tier)
# EXCHANGE_RATE_API_KEY=your_api_key_here

# Base currency cho tỷ giá (mặc định: USD)
EXCHANGE_RATE_BASE_CURRENCY=USD

# Cron schedule cho auto-update (mặc định: 2:00 AM mỗi ngày)
# Format: minute hour day month weekday
EXCHANGE_RATE_UPDATE_SCHEDULE=0 2 * * *

# Bật/tắt auto-update (true/false)
EXCHANGE_RATE_AUTO_UPDATE=true

# Timezone cho scheduler (optional, mặc định: UTC)
TZ=UTC
```

## Các API Provider được hỗ trợ

### 1. ExchangeRate-API.com (Khuyến nghị - Free tier)
- **URL**: https://exchangerate-api.com
- **Free tier**: 1,500 requests/month, không cần API key
- **Setup**: 
  - Không cần đăng ký cho free tier
  - Set `EXCHANGE_RATE_API_PROVIDER=exchangerate-api`
  - Không cần set `EXCHANGE_RATE_API_KEY`

### 2. Fixer.io
- **URL**: https://fixer.io
- **Free tier**: 100 requests/month
- **Setup**:
  - Đăng ký tại https://fixer.io
  - Lấy API key
  - Set `EXCHANGE_RATE_API_PROVIDER=fixer`
  - Set `EXCHANGE_RATE_API_KEY=your_fixer_api_key`

### 3. CurrencyLayer
- **URL**: https://currencylayer.com
- **Free tier**: 1,000 requests/month
- **Setup**:
  - Đăng ký tại https://currencylayer.com
  - Lấy API key
  - Set `EXCHANGE_RATE_API_PROVIDER=currencylayer`
  - Set `EXCHANGE_RATE_API_KEY=your_currencylayer_api_key`

## Cron Schedule Format

Format: `minute hour day month weekday`

Ví dụ:
- `0 2 * * *` - Mỗi ngày lúc 2:00 AM
- `0 0 * * *` - Mỗi ngày lúc midnight
- `0 */6 * * *` - Mỗi 6 giờ
- `0 2 * * 1` - Mỗi thứ 2 lúc 2:00 AM

## API Endpoints

### 1. Lấy tỷ giá hối đoái
```
GET /api/exchange-rates/rate?baseCurrency=USD&targetCurrency=EUR&date=2024-01-01
```

Response:
```json
{
  "code": 200,
  "message": "Exchange rate retrieved successfully",
  "result": {
    "baseCurrency": "USD",
    "targetCurrency": "EUR",
    "rate": 0.85,
    "date": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Chuyển đổi tiền tệ
```
POST /api/exchange-rates/convert
Content-Type: application/json

{
  "amount": 100,
  "fromCurrency": "USD",
  "toCurrency": "EUR",
  "date": "2024-01-01" // optional
}
```

Response:
```json
{
  "code": 200,
  "message": "Currency conversion retrieved successfully",
  "result": {
    "amount": 100,
    "fromCurrency": "USD",
    "toCurrency": "EUR",
    "convertedAmount": 85,
    "date": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. Cập nhật tỷ giá thủ công (Protected)
```
POST /api/exchange-rates/update?baseCurrency=USD
Headers: 
  Cookie: accessToken=your_token
```

Response:
```json
{
  "code": 200,
  "message": "Successfully updated 150 exchange rates",
  "result": {
    "savedCount": 150
  }
}
```

## Database Schema

Exchange rates được lưu trong collection `exchange_rates` với cấu trúc:

```typescript
{
  baseCurrency: string,      // Currency code (e.g., "USD")
  targetCurrency: string,     // Currency code (e.g., "EUR")
  rate: number,              // Exchange rate value
  date: Date,                // Date (normalized to start of day)
  source: string,            // API provider name
  createdAt: Date,
  updatedAt: Date
}
```

## Sử dụng trong Code

### Tự động cập nhật
Scheduler tự động chạy khi server start (nếu `EXCHANGE_RATE_AUTO_UPDATE=true`).

### Cập nhật thủ công
```typescript
import { triggerManualUpdate } from "./src/utils/exchangeRate.scheduler";

await triggerManualUpdate();
```

### Lấy tỷ giá trong code
```typescript
import { getExchangeRate, convertCurrency } from "./src/services/exchangeRate.service";

// Lấy tỷ giá
const rate = await getExchangeRate('USD', 'EUR');
// Returns: 0.85 or null if not found

// Chuyển đổi số tiền
const converted = await convertCurrency(100, 'USD', 'EUR');
// Returns: 85 or null if rate not found
```

## Lưu ý

1. **Rates được lưu theo ngày**: Mỗi ngày chỉ lưu một bộ rates để tránh duplicate
2. **Fallback**: Nếu không tìm thấy rate cho ngày hôm nay, hệ thống sẽ trả về rate mới nhất có sẵn
3. **Timezone**: Scheduler chạy theo timezone được set trong `TZ` env variable (mặc định: UTC)
4. **Transaction**: Tất cả operations sử dụng database transaction để đảm bảo tính nhất quán dữ liệu
5. **Error handling**: Nếu API call fail, hệ thống sẽ log error nhưng không crash server

## Troubleshooting

### Scheduler không chạy
- Kiểm tra `EXCHANGE_RATE_AUTO_UPDATE` có set là `true` không
- Kiểm tra logs khi server start
- Kiểm tra cron schedule format

### API call fail
- Kiểm tra `EXCHANGE_RATE_API_KEY` (nếu dùng fixer/currencylayer)
- Kiểm tra `EXCHANGE_RATE_API_PROVIDER` có đúng không
- Kiểm tra network connection
- Kiểm tra API quota/limits

### Rates không được lưu
- Kiểm tra database connection
- Kiểm tra logs để xem có error gì không
- Kiểm tra xem currencies đã được tạo trong database chưa
