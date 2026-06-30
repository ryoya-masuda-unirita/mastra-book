# 付録 ハンズオン環境のセットアップ

本書のハンズオンを始める前に準備しておくものをまとめています。詳しい画面操作は書籍の付録を参照してください。

## 付録1 GitHub Codespacesの準備

本書では、ブラウザ上でVS Code相当の開発環境を使えるGitHub Codespacesを前提にハンズオンを進めます。

### GitHubアカウントの作成

GitHubアカウントを持っていない場合は、次の公式ガイドを参考に作成してください。

- GitHub でのアカウントの作成 - GitHub Docs  
  https://docs.github.com/ja/get-started/start-your-journey/creating-an-account-on-github

### GitHubリポジトリの作成

GitHubの新規リポジトリ作成画面（ https://github.com/new ）で、任意のリポジトリを作成します。`Add a README file` にチェックを入れておくと、すぐにCodespacesを起動できます。

各章では、同じリポジトリ内に次のプロジェクトを作成します。

| 実施対象 | プロジェクト名 | 用途 |
|---|---|---|
| 第5章 | `rag-agent` | RAGエージェントの構築 |
| 第6〜7章 | `hitl-research` | Deep Researchアプリのワークフロー実装 |
| 第7章 | `hitl-research-react` | Deep Researchアプリのフロントエンド実装 |
| 第8〜12章 | `image-ai-service` | フルスタックアプリの実装 |

### Codespacesの起動

リポジトリ画面の `Code` ボタンから `Codespaces` タブを選び、`Create codespace on main` をクリックします。起動後は画面下部のターミナルで、各章READMEや書籍本文に掲載しているコマンドを実行します。

## 付録2 Google AI Studio APIキーの取得

本書のハンズオンでは、LLMおよび埋め込みモデルとしてGoogle Geminiを使います。Google AI Studio（ https://aistudio.google.com ）でAPIキーを作成し、各プロジェクトの `.env` に次の環境変数として設定します。

```bash
GOOGLE_GENERATIVE_AI_API_KEY=your-api-key
```

APIキーはパスワードと同じ機密情報です。第三者に共有せず、`.env` がGitHubにコミットされないようにしてください。

## 付録3 Tavily APIキーの取得

第6章のDeep Researchハンズオンでは、Web検索APIとしてTavilyを使います。Tavily Platform（ https://app.tavily.com ）でアカウントを作成し、ダッシュボードに表示されるAPIキーを各プロジェクトの `.env` に設定します。

```bash
TAVILY_API_KEY=your-api-key
```

Tavilyの無料プランでは、クレジットカード登録なしで月単位のAPIクレジットを利用できます。
