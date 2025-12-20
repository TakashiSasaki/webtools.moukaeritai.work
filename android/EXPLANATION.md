# 解説: Android Intent URI の構造

Chrome for Android (v25以降) では、アプリケーションを起動するために `intent:` スキームが推奨されています。

```text
intent:
   HOST/URI-path // Optional host
   #Intent;
      package=[string];
      action=[string];
      category=[string];
      component=[string];
      scheme=[string];
   end;
```

## 仕組み
従来のカスタムスキーム（例: `myapp://path`）とは異なり、`intent:` スキームはアプリケーションがインストールされていない場合のフォールバック（Google Play ストアへの遷移や、指定した `S.browser_fallback_url` へのリダイレクト）を制御できます。

## 構文のポイント
*   **package**: 起動したいアプリのパッケージ名（例: `com.google.android.youtube`）。これを指定すると、そのアプリが確実にターゲットになります。
*   **scheme**: アプリがデータとして受け取るスキーム（例: `https` や `geo`）。
*   **action**: `android.intent.action.VIEW` など。ただし、Chrome から呼び出せるアクションには制限があります。
*   **S.browser_fallback_url**: アプリが見つからなかった場合に遷移するウェブサイトのURL。

## 制約
セキュリティ上の理由から、Chrome はユーザーの操作（クリックなど）なしに Intent を発火させることをブロックすることがあります。また、`exported=false` な Activity は外部から起動できません。
