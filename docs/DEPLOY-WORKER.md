# Cloudflare Worker 部署指南（NT$0 月費起步）

你的決定是對的：**現在一律走 Worker，API Key 只放後端**，之後上架不必再改架構。  
Cloudflare Workers 免費額度每天 **10 萬次請求**，初期流量綽綽有餘。

## 前置

- [Cloudflare](https://dash.cloudflare.com/) 帳號（免費）
- [OCR.space](https://ocr.space/ocrapi) 金鑰（初期可用免費 `helloworld` 測試，上架後建議申請自己的 key）
- Node.js 18+

> **若 `npm install` 出現 ERESOLVE 錯誤**：專案已修正 `package.json` 版本。請刪除 `node_modules` 與 `package-lock.json` 後再執行 `npm install`。

## 步驟 1：部署 Worker

```powershell
cd backend\worker
npm install
npx wrangler login
```

瀏覽器會開啟，用你剛註冊的 Cloudflare 帳號登入並按 **Allow**。

確認已登入：

```powershell
npx wrangler whoami
```

應顯示你的 Email，而不是「not authenticated」。

### 1b. 註冊 workers.dev 子網域（首次必做，免費）

若 `.../workers/onboarding` 出現 **404**，請改用以下任一方式：

**方式 A（建議）** — 直接開啟子網域設定頁：

```
https://dash.cloudflare.com/?to=/ec632e7d4c73715b05c0bb4919ca19fe/workers/subdomain
```

**方式 B** — 左側選 **Workers & Pages** → 找到 **Your subdomain** → 按 **Change** 設定子網域（例如 `loise-cell`）。

完成後 Worker 網址會像：

```
https://choapptrans-api.loise-cell.workers.dev
```

然後在終端機**手動**執行（需能輸入 `y`，不要用自動化）：

```powershell
npm run deploy
```

出現 `register a workers.dev subdomain now?` 時輸入 **`y`** 並 Enter。

設定 OCR 金鑰（**只放 Cloudflare，不要寫進 App**）：

```powershell
.\set-ocr-secret.ps1 -OcrKey "你的OCR.space金鑰"
```

或手動：

```powershell
npx wrangler secret put OCR_SPACE_API_KEY
```

出現提示時貼上金鑰，按 Enter。

**強烈建議**再設一組隨機 Bearer token（自己記下來）：

```powershell
npx wrangler secret put API_SECRET
```

部署：

```powershell
npm run deploy
```

成功後會顯示 URL，例如：

```
https://choapptrans-api.你的帳號.workers.dev
```

測試：

```powershell
curl https://你的-worker-url/health
```

應回 `{"ok":true}`。

## 步驟 2：本機開發 .env

在專案根目錄建立 `.env`（不要 commit）：

```
EXPO_PUBLIC_API_BASE_URL=https://你的-worker-url
EXPO_PUBLIC_API_SECRET=你剛才設的 API_SECRET
```

**不要**設 `EXPO_PUBLIC_OCR_SPACE_API_KEY`，讓 OCR 只走 Worker。

重啟 Metro：

```powershell
npm run start:dev-client
```

## 步驟 3：EAS 正式建置 Secrets

上架用的 production 建置要把變數放在 EAS（不要寫進 git）：

```powershell
cd c:\Users\iFTY\Desktop\NproCho\ChoAppTranspro\ChoAppTrans
npx eas secret:create --name EXPO_PUBLIC_API_BASE_URL --value https://你的-worker-url --scope project
npx eas secret:create --name EXPO_PUBLIC_API_SECRET --value 你的API_SECRET --scope project
npx eas secret:create --name EXPO_PUBLIC_OCR_SPACE_API_KEY --value 你的OCR金鑰 --scope project
```

確認：

```powershell
npx eas secret:list
```

## 步驟 4：打 Production 包

```powershell
npx eas build --platform android --profile production
```

安裝後測試：拍照翻譯應仍正常，且 App 內**沒有** OCR API Key。

## 安全說明

| 項目 | 狀態 |
|------|------|
| OCR API Key | 只在 Worker（`wrangler secret`） |
| App 只帶 Worker URL + Bearer | 可被反編譯，但 Key 不在 App 內 |
| 限流 | 每 IP 每分鐘 30 次（`wrangler.toml` 可調） |
| 單字查詢 | 仍直連 dictionaryapi.dev（無金鑰，可接受） |
| OCR（OCR.space） | Worker 失敗時**由手機直連**（OCR.space 會阻擋 Cloudflare IP） |
| 翻譯（MyMemory） | **由手機直連**（MyMemory 會阻擋 Cloudflare IP） |

若 Bearer 被盜用，到 Cloudflare 旋轉 `API_SECRET` 並更新 EAS secret 即可。

## 費用

- Cloudflare Workers 免費方案：**NT$0／月**（10 萬 req／天內）
- 超出後才需付費，初期幾乎不會碰到

## 疑難排解

| 問題 | 解法 |
|------|------|
| 401 Unauthorized | 檢查 `EXPO_PUBLIC_API_SECRET` 與 Worker `API_SECRET` 一致 |
| OCR 失敗 | 檢查 `OCR_SPACE_API_KEY` secret 是否正確 |
| 本機仍直連 OCR | 確認 `.env` 有 `EXPO_PUBLIC_API_BASE_URL` 且重啟 Metro `--clear` |
| `Translation service unavailable` | 已改為手機直連 MyMemory；重載 App 後再試 |
| `OCR service unavailable` | 已改為 Worker 失敗時手機直連 OCR；確認 `.env` 有 `EXPO_PUBLIC_OCR_SPACE_API_KEY` 並重啟 Metro |
