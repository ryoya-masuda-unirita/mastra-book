# 第9章 画像生成アプリを作って学ぶガードレールとAgent Skills

第8章のアプリ基盤に、ガードレール・画像生成ツール・Agent Skills を加えた**完成状態のプロジェクト**を [`image-ai-service/`](./image-ai-service) に配置しています。第8章からの差分として、次の機能を追加しています。

| 節 | 追加する内容 |
|---|---|
| 9.3 ガードレールの実装 | `UnicodeNormalizer` / `TokenLimiterProcessor` / `PromptInjectionDetector` をチャット応答エージェントへ追加 |
| 9.6 Agent Skillsの実装 | 画像生成モデル定義、画像生成ツール、`workspace/skills/image-best-practices/` のスキルファイルを追加 |
| 9.7 生成画像表示UIの作成とAPIの呼び出し | ツール呼び出しと生成画像を表示するチャットUIへ更新 |

セットアップと動かし方（ローカル / GitHub Codespaces）は [`image-ai-service/README.md`](./image-ai-service) を参照してください。

> プロジェクトをゼロから作成する手順は書籍本文を参照してください。本ディレクトリには完成形のみを配置しています。
