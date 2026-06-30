# 第12章 フルスタックアプリの実装（デプロイ編）

この章のハンズオンが実施しやすいように、書籍に掲載されているコマンドをコピペしやすい形で掲載しています。第8〜12章の完成形サンプルは [`../chapter8-12/image-ai-service/`](../chapter8-12/image-ai-service) に配置しています。

## 12.3 Tursoのセットアップ

### マイグレーションの実行

```bash
TURSO_AUTH_DATABASE_URL=<TursoのURL> TURSO_AUTH_AUTH_TOKEN=<トークン> npx auth@1.6.15 migrate
```

## 12.4 Vercel Blobのセットアップ

### Vercel Blobのインストール

```bash
npm install @vercel/blob@2.4.0
```

## 12.5 Vercelへのデプロイ実施

Vercelに設定する主な環境変数です。

| 環境変数 | 用途 |
|---|---|
| `TURSO_AUTH_DATABASE_URL` | 認証DB（image-app-auth）のURL |
| `TURSO_AUTH_AUTH_TOKEN` | 認証DBのトークン |
| `TURSO_MASTRA_DATABASE_URL` | MastraストレージDB（image-app-mastra）のURL |
| `TURSO_MASTRA_AUTH_TOKEN` | MastraストレージDBのトークン |
| `TURSO_VECTOR_DATABASE_URL` | ベクトルDB（image-app-vector）のURL |
| `TURSO_VECTOR_AUTH_TOKEN` | ベクトルDBのトークン |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blobのアクセストークン |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google Gemini APIキー |
| `BETTER_AUTH_SECRET` | Better Authのシークレット |
| `BETTER_AUTH_URL` | Better Authが参照するアプリURL |
| `NEXT_PUBLIC_APP_URL` | ブラウザ側の認証クライアントが参照するURL |
| `LANGFUSE_PUBLIC_KEY` | LangfuseのPublic Key |
| `LANGFUSE_SECRET_KEY` | LangfuseのSecret Key |
| `LANGFUSE_BASE_URL` | LangfuseのエンドポイントURL |

## 完成形サンプルの動作確認

```bash
cd ../chapter8-12/image-ai-service
npm install --legacy-peer-deps
cp .env.example .env
npx auth@1.6.15 migrate -y
npm run dev
```

ブラウザで `http://localhost:3000/chat` を開きます。
