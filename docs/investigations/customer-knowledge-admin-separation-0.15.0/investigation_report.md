# 顧客ナレッジ管理分離 調査報告

作成日: 2026年8月7日

## 目的

顧客情報画面に配置されていたナレッジスキャンを独立させ、現段階では管理者だけが利用できるシステム管理機能へ移す。

## 調査結果

既存システムには `customer.knowledge.manage` と `/system-management/customer-knowledge` が存在し、CAG Project 及び知識源設定だけを管理していた。一方、スキャン、再取込、再分析及び候補確認は一般業務画面である `/customers` に配置され、Scan 参照は `environments.read`、各変更操作は三つの顧客ナレッジ権限へ分散していた。

## 実装結果

1. 顧客情報画面から Scan Query、Mutation、状態、候補及び操作 UI を削除した。
2. システム管理の「顧客ナレッジ管理」に対象組織機関選択、スキャン、再取込、再分析、候補反映及び候補却下を移した。
3. 組織機関は Code 昇順で表示し、選択値は組織機関物理 ID とした。
4. Gateway の入口、Scan 参照及び全変更操作をシステム範囲の `customer.knowledge.manage` に統一した。
5. CAG Project 及び知識源設定を同じ管理画面に維持した。

## 制約

`customer.knowledge.scan` と `customer.knowledge.review` は管理者専用期間中の画面及び API 判定に使用しない。将来一般利用者へ公開する場合は、業務責任と承認 Flow を確定した別要件で権限を再設計する。
