# GitHub Pages 上架步驟

## 1. 推送專案到 GitHub

若尚未建立 repo（建議名稱 `cho-app-trans`，與 Expo slug 一致）：

```bash
git remote add origin https://github.com/loise-cell/cho-app-trans.git
git push -u origin main
```

## 2. 開啟 Pages

1. 到 GitHub repo → **Settings** → **Pages**
2. **Source** 選 **Deploy from a branch**
3. **Branch** 選 `main`，資料夾選 **`/docs`**
4. 儲存後等待 1～3 分鐘

## 3. 確認網址

隱私權政策（填到 Google Play）：

```
https://loise-cell.github.io/cho-app-trans/privacy-policy.html
```

首頁（可選）：

```
https://loise-cell.github.io/cho-app-trans/
```

## 4. 更新 app.json

`extra.privacyPolicyUrl` 應與上列隱私政策網址一致（已預設為 `loise-cell` 帳號）。
