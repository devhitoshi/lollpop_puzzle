#!/usr/bin/env bash
# ロリポップ！デプロイナウへ公開する（lollpop_runner/deploy.sh と同じ型。docs/handoff.md の手作業の手順をスクリプトにしたもの）。
#
# 1. 除外指定が無く、. で始まらないファイル（README・docs・raw・scripts）も公開されるので、
#    公開するものだけをリポジトリの外の一時フォルダに集めて上げる。
# 2. JS・CSS は 1 年、HTML は 1 日キャッシュされる。js/ css/ を中身のハッシュ名のフォルダに入れ、HTML の参照を書き換える。
#    直下の js/ css/ も残すのは、1 日キャッシュされた古い HTML が壊れないようにするため。
#    assets/ は index.html からの相対で読むので直下だけに置く。data/（言葉）は未実装なので上げない（words.json の 404 は想定内）。
#    更新を確かめるときは、最後に表示する ?v= 付きの URL を開く。
set -euo pipefail
cd "$(dirname "$0")"
STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT

VER=$(cat index.html design.html $(find css js -type f | sort) | sha1sum | cut -c1-8)
cp -r og.png LICENSE css js assets design "$STAGE"/
rm -f "$STAGE/assets/skins/README.md"
mkdir "$STAGE/$VER"
cp -r css js "$STAGE/$VER"/
sed -e "s#href=\"css/#href=\"$VER/css/#g" -e "s#src=\"js/#src=\"$VER/js/#g" index.html > "$STAGE/index.html"
sed -e "s#'./js/config.js'#'./$VER/js/config.js'#" design.html > "$STAGE/design.html"
grep -q "$VER/js/main.js" "$STAGE/index.html" || { echo "index.html の書き換えに失敗"; exit 1; }
grep -q "$VER/js/config.js" "$STAGE/design.html" || { echo "design.html の書き換えに失敗"; exit 1; }

lolipop deploy --dir "$STAGE"   # 紐づけは .lolipop/project.json（gitignore 済み。無ければ lolipop project link 01M3P9F4MB2T3VJB4B6Q20WWYV）
echo "版: $VER"
echo "確認用: https://lollpop-puzzle.lolipop-now.app/?v=$VER"
