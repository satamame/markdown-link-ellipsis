# 開発メモ

## プロジェクトの作成

参考: [はじめての VS Code 拡張機能開発](https://zenn.dev/hiro256ex/articles/20230625_getstartedvscodeextension)

1. `npx yo code`
1. Extenxion type: New Extension (TypeScript)
1. Extension name: Markdown Link Ellipsis
1. Extension identifier: markdown-link-ellipsis
1. Extention description: Collapses long Markdown link URLs for cleaner editing.
1. Initialize git repository: Yes
1. Bundler to use: esbuild
1. Package manager to use: yarn

## 推奨拡張機能のインストール

- ESLint
- Extension Test Runner
- esbuild Problem Matchers

## package.json

- `activationEvents` に `onLanguage:markdown` を追加して、Markdown ファイルが開かれている時に拡張機能が有効になるようにした。
- コマンドを使わない拡張機能なので、`contributes.commands` を空にした。
- 