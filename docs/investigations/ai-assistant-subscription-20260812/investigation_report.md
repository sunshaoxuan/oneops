# AIアシスタント クイックアシスタント購読調査

## 要求

各クイックアシスタントへ一つの小さな購読アイコンを追加し、購読済み機能を「新しい話題」の直下へ表示する。購読済み機能から直接専用会話を作成できるようにする。

## 実装

1. `AiAssistantChat.tsx` のクイックアシスタント項目へ Star Icon を追加した。
2. 購読状態は `oneops.ai-assistant.<userId>.shortcut-subscriptions` へ快捷助手物理 ID 配列として保存する。
3. 最新公開 Shortcut 一覧と購読 ID を突合し、「購読した機能」区へ表示する。
4. 購読区の項目 Click は既存 `createAiAssistantSession` に Shortcut を渡す。
5. 購読解除は同じ Star Icon から行う。

## 検証

Portal 35 Files、225 Tests と Production Build 3850 Modules は合格した。正式配信ログは `delivery_succeeded` を確認した。Browser は新規 Tab の Frame Tree 取得時に Timeout となり、購読 Icon、購読区、Refresh 保持、Console、Screenshot の実行証拠は `evidence_missing` である。
