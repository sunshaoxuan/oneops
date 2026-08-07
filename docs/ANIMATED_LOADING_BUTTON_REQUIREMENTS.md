# アニメーションローディングボタン要件

## 目的

OneOps Portal の非同期操作に対し、処理中であることを視覚及びアクセシビリティ情報で明示する。業務画面は共通 React コンポーネントへ variant ID を指定し、25 種類の表現から用途に合うものを選択する。

## 利用契約

共通入口は `AnimatedLoadingButton` とする。既定 variant は `mechanical-iris` とし、`loaderVariant` へ公開されている 25 種類の ID を指定できる。`loading` が真の間は `aria-busy="true"` を設定し、同一操作の再送信を防ぐためボタンを無効化する。

```tsx
<AnimatedLoadingButton
  loading={saveMutation.isPending}
  loaderVariant="mechanical-iris"
  type="primary"
>
  保存
</AnimatedLoadingButton>
```

## 動作要件

1. variant は利用時に動的読込を行い、未使用のアニメーションを初期 bundle へ含めない。
2. 複数ボタンの描画は共通スケジューラで最大 30fps に制御する。
3. 画面外、非表示タブ及びアンマウント後は描画を停止する。
4. `prefers-reduced-motion: reduce` では静止フレームを表示する。
5. WebGL 2 の初期化に失敗した場合は、上流実装が提供する Canvas 表現へ切り替える。
6. ローダー描画は装飾要素として `aria-hidden` にし、ボタン自身の業務ラベルをアクセシブル名として維持する。
7. `/ui/loader-buttons` で 25 種類の variant ID、名称、方式及び実表示を確認できる。

## 上流工程及びライセンス

取得元は `https://loader-buttons.appllama.io/`、canonical URL は `https://loader-buttons.experiments.appllama.io/` である。2026-08-07 時点の公開 `LICENSE` は GNU General Public License Version 3 である。公開 `README.md`、ライセンス及び無改変の上流ソースを `app/packages/animated-loading-buttons/src/third-party` に保持する。OneOps 固有の export、型及び React アダプターは上流 snapshot の外側に配置する。

## 変更対象外

業務 API、データモデル、認可、保存処理及び既存 Ant Design Button の一括置換は行わない。各業務画面への適用は、その操作の処理状態と表示要件を確認した個別変更として実施する。
