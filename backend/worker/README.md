# 部署 API Proxy

將 OCR／翻譯請求轉經 Cloudflare Worker，避免 API Key 暴露於 App 內。

## 前置

- [Cloudflare](https://dash.cloudflare.com/) 帳號
- Node.js 18+

## 步驟

```bash
cd backend/worker
npm install
npx wrangler login
npx wrangler secret put OCR_SPACE_API_KEY   # 貼上你的 OCR.space 金鑰
# 可選：額外保護
npx wrangler secret put API_SECRET          # 自訂 Bearer token
npm run deploy
```

部署成功後會顯示 Worker URL，例如 `https://choapptrans-api.xxx.workers.dev`。

## App 設定

在專案根目錄 `.env` 或 EAS Secrets 設定：

```
EXPO_PUBLIC_API_BASE_URL=https://choapptrans-api.xxx.workers.dev
```

若設定了 `API_SECRET`，需在 App 的 `apiConfig` 請求加上 `Authorization: Bearer ...`（正式版可再擴充）。

## 端點

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/health` | 健康檢查 |
| POST | `/v1/ocr` | `{ base64Image, sourceLanguage }` |
| POST | `/v1/translate` | `{ text, source, target }` |

預設每 IP 每分鐘 30 次請求（`RATE_LIMIT_PER_MINUTE`）。

## 商用建議

- OCR.space 免費 `helloworld` 金鑰不適合正式上架，請申請付費方案
- 流量大時考慮改用 Google Cloud Vision、Azure OCR 或 DeepL 等商用 API
- 上架後請在 Worker 設定付費金鑰，並依帳單調整 App 內扣點（`src/services/pointsLedger.ts`）：
  - 短句最低點數 `MIN_TRANSLATION_COST`（目前 3）
  - 字數區間 `CHARS_PER_POINT`（目前每 50 字 +1 點）
  - 廣告獎勵與爆擊機率亦同檔案
