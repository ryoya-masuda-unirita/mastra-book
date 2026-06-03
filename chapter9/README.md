# 第9章 画像生成アプリを作って学ぶガードレールとAgent Skills

この章のハンズオンが実施しやすいように、書籍に掲載されている操作を確認しやすい形でまとめています。完成状態のプロジェクト一式は [`image-ai-service/`](./image-ai-service) に配置しています。

## GitHub Codespaces で動かす場合

Codespaces では転送URLでのアクセスや、Better Auth・Next.js Server Action のオリジン設定が必要です。詳細は [`image-ai-service/README.md` の「GitHub Codespaces で動かす場合」](./image-ai-service/README.md#github-codespaces-で動かす場合) を参照してください。

第9章では新しいインストール系コマンドはありません。既存の `image-ai-service` に、次の機能を追加します。

| 節 | 追加する内容 |
|---|---|
| 9.3 ガードレールの実装 | `UnicodeNormalizer` / `TokenLimiterProcessor` / `PromptInjectionDetector` をチャット応答エージェントへ追加 |
| 9.6 Agent Skillsの実装 | 画像生成モデル定義、画像生成ツール、`workspace/skills/image-best-practices/` のスキルファイルを追加 |
| 9.7 生成画像表示UIの作成とAPIの呼び出し | ツール呼び出しと生成画像を表示するチャットUIへ更新 |

## 動作確認

```bash
npm run dev
```

ブラウザで `http://localhost:3000/chat` を開き、画像生成を依頼します。
