// 第4章 4.3 AI SDK UIの紹介（クライアント側） - 原稿 L245-297
'use client';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState } from 'react';

export default function Page() {
  // messages: チャット履歴の配列
  // sendMessage: メッセージ送信用の関数
  // status: チャットの状態（'ready', 'streaming'など）
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat', // バックエンドAPIのエンドポイント
    }),
  });
  // ユーザー入力を管理するローカルステート
  const [input, setInput] = useState('');
  return (
    <>
      {/* チャット履歴の表示 */}
      {messages.map(message => (
        <div key={message.id}>
          {message.role === 'user' ? 'User: ' : 'AI: '}
          {/* メッセージの各部分（テキスト、ツール呼び出しなど）を表示 */}
          {message.parts.map((part, index) =>
            part.type === 'text' ? <span key={index}>{part.text}</span> : null,
          )}
        </div>
      ))}
     {/* メッセージ送信フォーム */}
      <form
        onSubmit={e => {
          e.preventDefault();
          if (input.trim()) {
            sendMessage({ text: input }); // メッセージを送信
            setInput(''); // 入力欄をクリア
          }
        }}
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={status !== 'ready'}  // ストリーミング中は入力を無効化
          placeholder="Say something..."
        />
        <button type="submit" disabled={status !== 'ready'}>
          Submit
        </button>
      </form>
    </>
  );
}
