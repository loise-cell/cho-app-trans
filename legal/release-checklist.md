# iOS / Android 上架檢查清單

## 技術

- [ ] 接入正式 OCR API（付費 OCR.space 或 Vision / Azure）
- [ ] 接入正式翻譯 API（DeepL / Google Cloud 等商用方案）
- [x] 字典 API 已串接（dictionaryapi.dev，英文為主）
- [x] 廣告獎勵已接 AdMob Rewarded Ads
- [ ] 後端完成點數帳本（不可只放前端）
- [ ] Server 驗證廣告回調
- [x] API Proxy 骨架已備（`backend/worker/`，見 `docs/DEPLOY-WORKER.md`）
- [ ] 部署 Worker 並設定 EAS Secrets（`EXPO_PUBLIC_API_BASE_URL`、`EXPO_PUBLIC_API_SECRET`）
- [ ] 依實際 API 帳單微調 `pointsLedger.ts` 扣點常數

## 合規

- [x] 隱私權政策（`legal/privacy-policy.md` + App 內可檢視）
- [x] 服務條款（`legal/terms-of-service.md`）
- [x] 廣告與點數規則（`legal/ad-points-policy.md`）
- [x] 首次啟動隱私同意（語言選擇頁）
- [x] 翻譯結果免責聲明（結果頁）
- [x] 隱私政策公開網頁（`docs/privacy-policy.html` + GitHub Pages，見 `docs/GITHUB-PAGES.md`）
- [ ] 資料刪除請求流程（客服 Email 已列於政策）
- [ ] 侵權申訴窗口
- [ ] 未成年人與廣告內容分級設定

## App Store / Google Play

- [x] 相機與相簿權限描述（`app.json` infoPlist）
- [ ] App 圖示與啟動畫面（`assets/`，見 `app.json`）
- [ ] 商店隱私揭露欄位填寫正確
- [ ] 不得引導站外支付（若販售點數需走 IAP / Play Billing）
- [x] 主要流程：看廣告、發點、扣點、翻譯失敗不扣點
- [ ] Production 建置使用正式 AdMob 單元（非測試廣告）

## 聯絡

- 客服 Email：`Ls214306@gmail.com`
