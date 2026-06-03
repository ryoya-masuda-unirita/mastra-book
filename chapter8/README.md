# 第8章 画像生成アプリを作って学ぶアプリ基盤

この章のハンズオンが実施しやすいように、書籍に掲載されているコマンドをコピペしやすい形で掲載しています。第8章末の状態のプロジェクト一式は [`image-ai-service/`](./image-ai-service) に配置しています。第9章末の状態は [`../chapter9/image-ai-service/`](../chapter9/image-ai-service)、第12章末の完成形は [`../chapter8-12/image-ai-service/`](../chapter8-12/image-ai-service) を参照してください。

## 8.3 ハンズオンの準備

### Next.jsプロジェクトの初期化

```bash
npx create-next-app@16.2.6 image-ai-service --yes --ts --eslint --tailwind --src-dir --app --turbopack --no-react-compiler --no-import-alias
```

### Mastraの初期化

```bash
cd image-ai-service
npm install mastra@1.10.2 @mastra/core@1.37.1 --legacy-peer-deps
npx mastra init
```

### AI SDK関連ライブラリのインストール

```bash
npm install @mastra/ai-sdk@1.4.3 ai@6.0.193 @ai-sdk/react@3.0.195
```

## 8.5 チャットUIの作成とAPIの呼び出し

### shadcn/uiの導入

```bash
npx shadcn@4.9.0 init
npx shadcn@4.9.0 add button card input label
```

## 8.8 認証システムの実装

### Better AuthとLibSQLアダプターのインストール

```bash
npm install better-auth@1.6.13 @libsql/kysely-libsql@0.4.1 kysely@0.28.17
npx auth@1.6.13 migrate
```

## 8.12 プラン管理機能の実装

### マイグレーションの実行

```bash
npx auth@1.6.13 migrate
```

### トークン追跡テーブルの作成

```bash
sqlite3 auth.db "
CREATE TABLE IF NOT EXISTS token_usage (
  id          TEXT PRIMARY KEY
              DEFAULT (lower(hex(randomblob(16)))),
  user_id     TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  year_month  TEXT NOT NULL,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, year_month)
);"
```

## 8.13 プラン管理UIの作成とAPIの呼び出し

```bash
npx shadcn@4.9.0 add badge
```

## 動作確認

```bash
npm run dev
```

ブラウザで `http://localhost:3000/chat` を開きます。
