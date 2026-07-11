# ChoAppTrans

跨平台（iOS / Android）拍照翻譯 App 範例，包含以下能力：

- 拍照或選圖
- 二次調整翻譯範圍（拖曳藍框）
- 翻譯前扣點（短句最低 3 點，每 50 字 +1 點）
- 看廣告得點（一般 +1 點，幸運爆擊 1%）
- 點英文單字看中文解釋（示範字典資料）

## 快速開始

1. 安裝依賴

```bash
npm install
```

2. 啟動

```bash
npm run start
```

3. 在 Expo 中執行 iOS / Android

## 目前為 MVP 示範

- OCR / 翻譯 / 字典使用 mock 服務（`src/services/mockTranslator.ts`）
- 廣告是模擬按鈕（正式版需接 AdMob Rewarded Ads）
- 點數記帳目前在前端狀態（正式版建議改為後端帳本）

## 正式商用建議

- 後端建立「點數帳本」與「廣告回調驗證」
- 使用 server-to-server 驗證 rewarded ad 發放
- API Key 放在後端，不可放在 App
- 上架前完成 `legal/` 內文件並交由法務審閱
