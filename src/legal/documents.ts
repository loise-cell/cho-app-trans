export type LegalDocId = "privacy" | "terms" | "adPoints";

export type LegalSection = {
  heading: string;
  paragraphs: string[];
};

export type LegalDocument = {
  id: LegalDocId;
  title: string;
  updatedAt: string;
  sections: LegalSection[];
};

export const LEGAL_CONTACT_EMAIL = "Ls214306@gmail.com";

export const LEGAL_DOCUMENTS: Record<LegalDocId, LegalDocument> = {
  privacy: {
    id: "privacy",
    title: "隱私權政策",
    updatedAt: "2026-07-11",
    sections: [
      {
        heading: "我們蒐集哪些資料",
        paragraphs: [
          "相機／相簿圖片：您主動提供，用於 OCR 與翻譯，處理時會上傳至 OCR／翻譯服務。",
          "辨識與翻譯文字：於翻譯流程中處理。",
          "點數、徽章、語言設定：儲存在裝置本機，目前不上傳至我們的伺服器。",
          "廣告互動：由 Google AdMob 依其隱私政策處理。"
        ]
      },
      {
        heading: "第三方服務",
        paragraphs: [
          "OCR.space（文字辨識，經 Cloudflare Worker 代理）",
          "MyMemory / Translated.net（機器翻譯，經 Worker 代理）",
          "dictionaryapi.dev（英文單字查詢）",
          "Google AdMob（獎勵式廣告）",
          "若啟用 API 代理伺服器，內容可能先經我們的伺服器轉送以保護金鑰與限流，不作訓練或再行銷用途。"
        ]
      },
      {
        heading: "您的權利",
        paragraphs: [
          "可拒絕相機／相簿權限；可解除安裝以刪除本機資料。",
          `資料相關問題請聯絡：${LEGAL_CONTACT_EMAIL}`
        ]
      }
    ]
  },
  terms: {
    id: "terms",
    title: "服務條款",
    updatedAt: "2026-07-11",
    sections: [
      {
        heading: "服務內容",
        paragraphs: [
          "本 App 提供拍照／選圖、框選 OCR、翻譯、單字查詢，以及透過獎勵廣告取得點數後換取翻譯次數。"
        ]
      },
      {
        heading: "翻譯免責聲明",
        paragraphs: [
          "OCR、翻譯與單字結果僅供參考，不保證正確。",
          "不得用於法律、醫療、財務等需專業判斷之情境。",
          "重要文件請尋求合格人工翻譯。"
        ]
      },
      {
        heading: "使用者責任",
        paragraphs: [
          "僅上傳您有合法使用權之內容；不得刷點、破解或濫用服務。",
          "點數不具現金價值，不得轉讓。"
        ]
      },
      {
        heading: "聯絡",
        paragraphs: [`Email：${LEGAL_CONTACT_EMAIL}`]
      }
    ]
  },
  adPoints: {
    id: "adPoints",
    title: "廣告與點數規範",
    updatedAt: "2026-07-11",
    sections: [
      {
        heading: "取得點數",
        paragraphs: [
          "完整觀看 Google AdMob 獎勵廣告後發放點數（預設 +1，含幸運爆擊）。",
          "未完整觀看不發點。開發版可能使用 Google 測試廣告。"
        ]
      },
      {
        heading: "消耗點數",
        paragraphs: [
          "每次翻譯：短句最低 3 點，每 50 字多 1 點；僅在 OCR 與翻譯成功後扣點，失敗不扣點。"
        ]
      },
      {
        heading: "保存與客訴",
        paragraphs: [
          "點數目前存於裝置本機；清除資料可能歸零。",
          `廣告未入點請來信：${LEGAL_CONTACT_EMAIL}`
        ]
      }
    ]
  }
};

export function legalDocTitle(id: LegalDocId): string {
  return LEGAL_DOCUMENTS[id].title;
}
