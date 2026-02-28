# MornGifProcessor

<p align="center">
  <img src="static/icon.png" alt="MornGifProcessor" width="128" />
</p>

<p align="center">
  ブラウザで動く GIF / APNG 加工ツール
</p>

<p align="center">
  <a href="https://tsukumistudio.github.io/MornGifProcessor/">
    <img src="https://img.shields.io/badge/Open-Web%20App-a3a825" alt="Open Web App" />
  </a>
  <img src="https://img.shields.io/github/license/TsukumiStudio/MornGifProcessor" alt="License" />
</p>

## 概要

MornGifProcessor は、GIF・APNG ファイルをブラウザ上で加工できる Web アプリケーションです。
ffmpeg.wasm を利用してクライアントサイドで処理を行うため、ファイルがサーバーにアップロードされることはありません。

**https://tsukumistudio.github.io/MornGifProcessor/**

## 機能

- **リサイズ** — ピクセル指定またはパーセント指定でサイズ変更
- **クロップ** — 任意の範囲を切り抜き
- **回転・反転** — 90° / 180° / 270° 回転、水平・垂直反転
- **速度変更** — 再生速度の倍率を変更
- **フレーム編集** — 不要なフレームを選択して削除
- **色調補正** — 明るさ・コントラスト・彩度の調整
- **フィルタ** — グレースケール、セピア、ネガ、ぼかし、シャープ
- **色数制限** — パレットの色数を削減
- **フォーマット変換** — GIF / APNG 形式でダウンロード
- **連番PNG書き出し** — 全フレームを PNG に展開して ZIP でダウンロード
- **プレビュー** — 適用前に結果を確認し、やめる / 適用を選択
- **元に戻す** — 操作履歴から任意の状態に戻す
- **ドラッグ&ドロップ** — ファイルをウィンドウにドロップして読み込み

## ライセンス

[The Unlicense](LICENSE)
