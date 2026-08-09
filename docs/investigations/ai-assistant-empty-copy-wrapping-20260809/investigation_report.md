# AI助手空状態文言の孤立行 調査・実装記録

## 調査対象

AI助手の空状態説明「新しい話題を作成して、AI との会話を始めます。」で、末尾の「す。」だけが次行へ残る表示を対象とした。

## 原因

`ai-assistant.css` の空状態説明へ `max-width: 300px` が固定指定されていた。Screenshot の本文領域には追加の横幅があるにもかかわらず利用されず、現行日本語 Copy の描画幅が固定上限を僅かに超えたため、末尾の短い句が孤立した。

## 修正

- 最大幅を `min(420px, calc(100% - 32px))` とし、本文領域の利用可能幅を使用する。
- `margin-inline: auto` で説明を中央へ維持する。
- `text-wrap: balance` で狭い画面の短文を均衡した行長へする。
- 空状態 Rule だけを検証する回帰 Test を追加する。

## 検証境界

単体 Test、全量 Check、Production Build、Spring Test 及び運用 Script Test は合格した。Codex App Browser は Windows 統合認証を完了できず、Chrome と Edge の接続も利用できなかったため、ログイン後の正式ページ Screenshot と Console は `evidence_missing` である。

この Browser 証拠が得られるまで正式 Runtime への配信、正式 Release Tag 及び完了判定を行わない。
