# ==============================================================================
# Chrome Web Store — OAuth リフレッシュトークン取得手順
# ==============================================================================
#
# 前提: Google Cloud Console で OAuth 2.0 クライアント ID を作成済みであること。
#   - アプリケーションの種類: ウェブアプリケーション
#   - 承認済みのリダイレクト URI に以下を追加:
#       https://developers.google.com/oauthplayground
#
# 手順:
#   1. https://developers.google.com/oauthplayground を開く
#
#   2. 右上の歯車アイコン(Settings) をクリックし
#      "Use your own OAuth credentials" にチェックを入れる。
#      OAuth Client ID / Secret に自分のクライアント ID・シークレットを入力。
#
#   3. 左ペイン "Step 1" で以下のスコープを入力して "Authorize APIs" をクリック:
#       https://www.googleapis.com/auth/chromewebstore
#
#   4. Google アカウントで認可 → "Step 2" に戻る。
#      "Exchange authorization code for tokens" をクリック。
#
#   5. "Refresh token" の値をコピーし、GitHub リポジトリの
#      Settings → Secrets → Actions に以下の名前で登録する:
#
#       CHROME_CLIENT_ID      — OAuth クライアント ID
#       CHROME_CLIENT_SECRET  — OAuth クライアントシークレット
#       CHROME_REFRESH_TOKEN  — 手順5 で取得したリフレッシュトークン
#       CHROME_EXTENSION_ID   — CWS デベロッパーダッシュボードで ZIP を
#                               アップロードして取得する拡張機能 ID
#
# 注意:
#   - リフレッシュトークンの有効期限は無期限(ただし 6 ヶ月間未使用で失効)。
#   - OAuth 同意画面がテストモードの場合は自分のメールを「テストユーザー」に追加すること。
# ==============================================================================
