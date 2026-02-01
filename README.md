***

### １．システム概要
ブラウザ上でブックマークをフォルダ階層で管理するシンプルなエクスプローラです。  
File System Access API で選択したフォルダに `bookmarks.json` と `quickaccess.json` を保存し、次回起動時に復元します。  
Quick Access によるショートカット登録、並び替え、削除が行えます。

### ２．技術スタック
HTML5 / CSS3 / Vanilla JavaScript (ES6)  
File System Access API（Chrome / Edge などの Chromium 系ブラウザ）  
Nginx（Docker での配信時）

### ３．セットアップ
本アプリは静的ファイルのみで動作します。File System Access API 利用のため、`http://localhost` などの安全なオリジンで配信してください。  
  
例：簡易サーバーで起動  
`python3 -m http.server 8081`  
  
例：Docker で起動  
`docker compose up --build`

### ４．アクセス
`http://localhost:8081`

### ５．使い方
1. 画面右上の「Select Folder」からデータ保存先フォルダを選択  
2. 「Name」に名称、「URL」にリンク（フォルダ作成時は URL を空欄）を入力して add  
3. 一覧の行をクリックして選択、OPEN でリンクを開く  
4. 右クリックで「Add to Quick Access」、Quick Access はドラッグで並び替え  
5. delete で削除（Quick Access は右クリック Delete）

### ６．ディレクトリ構成
```
.
├─ assets
│  ├─ css
│  │  └─ styles.css
│  └─ js
│     └─ app.js
├─ index.html
├─ Dockerfile
├─ docker-compose.yml
└─ README.md
```

***
