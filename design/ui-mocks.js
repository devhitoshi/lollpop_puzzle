// UI world-view roughs for design.html (static mocks, not the game).
// Every variant uses the same part numbers U1–U11 so they can be compared: "B 案の U3 がいい".
// The board is a screenshot of the real game (design/board.png); its background follows the theme once implemented.

export const UI_PARTS = [
  ['U1', '背景', '画面全体の地'],
  ['U2', 'ロゴ', '「!!!!!!!」と「落ちものパズル」'],
  ['U3', 'メインボタン', 'あそぶ／もう一回'],
  ['U4', 'サブボタン', '遊び方・とは・タイトルへ'],
  ['U5', 'HUD', '残り時間・スコア・「!」ゲージ'],
  ['U6', '盤面の枠', '盤面そのもの（飴）は変えない'],
  ['U7', '救済ボタン', '下を爆発させて混ぜ直す、残り 3 回'],
  ['U8', 'フィーバーの残り時間', 'フィーバー中だけ出る'],
  ['U9', '結果の主役', 'ポップなお祭り度'],
  ['U10', '結果の数値', 'スコア・最大コンボ・フィーバー・推し色'],
  ['U11', '非公式の表記', ''],
];

const MEMBER = ['#cc0000', '#f5c400', '#7fd4e8', '#2e9e5b', '#ffffff'];
const bangs = (cls = '') => `<span class="bangs ${cls}">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<i style="--c:${MEMBER[i % 5]}${i % 5 === 4 ? ';--stroke:#ff7fb6' : ''}">!</i>`).join('')}</span>`;
const NOTE = '非公式のファン制作（AIぽっぱー）。ろりぽっぷ!!!!!!! の運営・GMOペパボとは関係ありません。';
const board = (cls) => `<div class="${cls}" data-part="U6"><img src="design/board.png" alt=""></div>`;

const DECO_SHAPES = {
  heart: '<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.6 7.3L12 17.8l-6.2 3.7 1.6-7.3L2 9.5l7.1-.6z"/></svg>',
  bang: '!',
};
// [shape, left, top, size, rotate(deg), color]
const deco = (items) => items.map(([k, x, y, s, r, c]) =>
  `<i class="e-deco ${k}" style="left:${x}px;top:${y}px;--s:${s}px;--r:${r}deg;--c:${c}">${DECO_SHAPES[k]}</i>`).join('');
const P = { pink: '#ff4f9a', soft: '#ff9ec8', yellow: '#ffd44d', blue: '#9fe0ef', green: '#6cc28e' };

export const UI_VARIANTS = [
  {
    id: 'candy',
    name: 'A キャンディポップ',
    status: '採用・未実装',
    concept: '飴の世界。パステルのストライプ、飴の包み紙のパネル、押すとぷにっと沈むボタン、丸ゴシックの極太。明るく、SNS で目を引く。',
    rescueName: 'ぽっぷボム',
    screens: {
      title: `
        <div class="bg" data-part="U1"></div>
        <div class="c-logo" data-part="U2">${bangs()}<b>落ちものパズル</b></div>
        <div class="c-wrap"><p>同じ色のロリポップを<br>3 つなぞって消そう！</p></div>
        <div class="c-peek"><img src="design/board.png" alt=""></div>
        <div class="c-actions">
          <span class="c-btn" data-part="U3">あそぶ</span>
          <div class="c-row"><span class="c-btn sub" data-part="U4">遊び方</span><span class="c-btn sub">ろりぽっぷ!!!!!!! とは</span></div>
        </div>
        <p class="c-note" data-part="U11">${NOTE}</p>`,
      play: `
        <div class="bg" data-part="U1"></div>
        <div class="c-hud" data-part="U5">
          <span class="c-chip"><small>のこり</small><b>1:36</b></span>
          ${bangs('mini on5')}
          <span class="c-chip"><small>スコア</small><b>18,420</b></span>
        </div>
        <div class="c-fever" data-part="U8"><span>FEVER</span><i><em></em></i><b>あと 6</b></div>
        ${board('c-board')}
        <div class="c-rescue" data-part="U7"><span class="c-bomb"></span><b>ぽっぷボム</b><span class="pips"><i></i><i></i><i class="used"></i></span></div>
        <p class="c-note small" data-part="U11">非公式のファン制作（AIぽっぱー）</p>`,
      result: `
        <div class="bg" data-part="U1"></div>
        <div class="c-logo small" data-part="U2">${bangs()}</div>
        <div class="c-card">
          <div data-part="U9"><small>ポップなお祭り度</small><b class="pct">71<span>%</span></b><em>お祭りの真ん中</em></div>
          <dl data-part="U10"><div><dt>スコア</dt><dd>213,400</dd></div><div><dt>最大コンボ</dt><dd>23</dd></div><div><dt>フィーバー</dt><dd>4 回</dd></div><div><dt>今日の推し色</dt><dd><i style="background:#cc0000"></i>くるみ</dd></div></dl>
        </div>
        <div class="c-actions">
          <span class="c-btn" data-part="U3">もう一回</span>
          <div class="c-row"><span class="c-btn sub" data-part="U4">画像でシェア</span><span class="c-btn sub">X で投稿</span></div>
        </div>
        <p class="c-note" data-part="U11">${NOTE}</p>`,
    },
  },
  {
    id: 'stylish-plus',
    cls: 'ui-stylish ui-stylish-plus',
    name: 'E+ かわいいスタイリッシュ',
    status: '採用・実装済み',
    concept: '実装済み（下の「画面（実装済み）」が実物）。E の形（斜めのパネルとボタン、英字の小見出し、傾けた太い数字、四隅の括弧、ランク文字）はそのまま、色をろりぽっぷらしいかわいい色に変えた案。淡いピンクの地にピンク寄りの格子線、文字とパネルは濃いプラム、押せるものはろりぽっぷピンクでピンクの影、ストライプはメンバーカラーを淡くしたもの。小さなハート・星・「!」をちりばめる。',
    rescueName: 'ぽっぷボム',
    screens: stylishScreens({
      title: [['star', 34, 24, 22, 10, P.yellow], ['bang', 150, 20, 28, 12, P.pink], ['heart', 20, 282, 24, -14, P.pink], ['star', 128, 300, 16, 0, P.blue],
        ['bang', 36, 522, 30, -8, P.soft], ['star', 176, 560, 18, 20, P.yellow], ['heart', 322, 530, 28, 14, P.soft], ['heart', 56, 760, 16, 8, P.soft], ['star', 318, 762, 20, -10, P.green]],
      play: [['heart', 36, 556, 26, -12, P.pink], ['bang', 112, 600, 22, -10, P.yellow], ['bang', 182, 640, 34, 10, P.soft], ['star', 296, 572, 22, 12, P.yellow],
        ['star', 64, 686, 16, 0, P.blue], ['heart', 318, 684, 18, 16, P.soft], ['star', 236, 712, 14, -8, P.green]],
      result: [['star', 296, 44, 26, 12, P.yellow], ['bang', 264, 76, 28, 12, P.soft], ['heart', 342, 90, 18, -10, P.pink],
        ['heart', 36, 556, 24, -14, P.soft], ['star', 196, 548, 18, 0, P.blue], ['bang', 326, 540, 30, 10, P.pink], ['heart', 56, 760, 16, 8, P.soft], ['star', 318, 762, 20, -10, P.green]],
    }, 'ぽっぷボム'),
  },
  {
    id: 'matsuri',
    name: 'B 夜のポップなお祭り',
    status: '不採用（参考）',
    concept: 'コンセプト「ポップなお祭り」に寄せた夜の縁日。5 色の提灯と花火、のれんのロゴ、木札のボタン、屋台の枠。救済は「花火」、結果は「お祭りみくじ」。',
    rescueName: '花火',
    screens: {
      title: `
        <div class="bg" data-part="U1"><span class="fw" style="left:40px;top:120px;--c:#ff7fbf"></span><span class="fw big" style="left:230px;top:70px;--c:#7fd4e8"></span><span class="fw" style="left:290px;top:250px;--c:#f5c400"></span></div>
        <div class="m-lanterns">${MEMBER.map((c) => `<i style="--c:${c}"></i>`).join('')}</div>
        <div class="m-noren" data-part="U2">
          <div class="panels">${MEMBER.map((c) => `<i style="--c:${c}"></i>`).join('')}</div>
          <div class="text">${bangs()}<b>落ちものパズル</b></div>
        </div>
        <p class="m-lead">ろりぽっぷ!!!!!!! のお祭りへようこそ<br>同じ色の飴を 3 つなぞって消そう</p>
        <div class="m-actions">
          <span class="m-btn red" data-part="U3">あそぶ</span>
          <div class="m-row"><span class="m-btn" data-part="U4">遊び方</span><span class="m-btn">とは</span></div>
        </div>
        <p class="m-note" data-part="U11">${NOTE}</p>`,
      play: `
        <div class="bg" data-part="U1"><span class="fw" style="left:300px;top:40px;--c:#ff7fbf"></span></div>
        <div class="m-hud" data-part="U5">
          <span class="m-plaque"><small>のこり</small><b>1:36</b></span>
          <span class="m-mini-lanterns">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<i class="${i < 5 ? 'on' : ''}" style="--c:${MEMBER[i % 5]}"></i>`).join('')}</span>
          <span class="m-plaque"><small>スコア</small><b>18,420</b></span>
        </div>
        <div class="m-fever" data-part="U8"><span>FEVER</span><i><em></em><s></s></i><b>あと 6</b></div>
        <div class="m-stall">${board('m-board')}</div>
        <div class="m-rescue" data-part="U7"><span class="fw-icon"></span><b>花火</b><span class="pips"><i></i><i></i><i class="used"></i></span></div>
        <p class="m-note small" data-part="U11">非公式のファン制作（AIぽっぱー）</p>`,
      result: `
        <div class="bg" data-part="U1"><span class="fw big" style="left:20px;top:40px;--c:#f5c400"></span><span class="fw" style="left:280px;top:90px;--c:#ff7fbf"></span></div>
        <div class="m-lanterns">${MEMBER.map((c) => `<i style="--c:${c}"></i>`).join('')}</div>
        <div class="m-mikuji">
          <div class="head" data-part="U2">お祭りみくじ</div>
          <div data-part="U9" class="main"><small>ポップなお祭り度</small><b class="pct">71<span>%</span></b><span class="hanko">真ん中</span></div>
          <dl data-part="U10"><div><dt>得点</dt><dd>213,400</dd></div><div><dt>最大コンボ</dt><dd>23</dd></div><div><dt>フィーバー</dt><dd>4 回</dd></div><div><dt>今日の推し色</dt><dd><i style="background:#cc0000"></i>くるみ</dd></div></dl>
        </div>
        <div class="m-actions">
          <span class="m-btn red" data-part="U3">もう一回</span>
          <div class="m-row"><span class="m-btn" data-part="U4">画像でシェア</span><span class="m-btn">X で投稿</span></div>
        </div>
        <p class="m-note" data-part="U11">${NOTE}</p>`,
    },
  },
  {
    id: 'live',
    name: 'C ライブ会場',
    status: '不採用（参考）',
    concept: '現場の空気。暗いステージにスポットライト、ペンライト色のネオン、LED の得点板。救済は「銀テ発射」、結果はチケット。',
    rescueName: '銀テ発射',
    screens: {
      title: `
        <div class="bg" data-part="U1"><span class="beam" style="--x:20%;--c:#ff4fa8;--r:-18deg"></span><span class="beam" style="--x:80%;--c:#7fd4e8;--r:18deg"></span><span class="beam" style="--x:50%;--c:#f5c400;--r:0deg"></span></div>
        <div class="l-logo" data-part="U2"><span class="neon-bangs">!!!!!!!</span><b>落ちものパズル</b><small>LOLLPOP PUZZLE STAGE</small></div>
        <div class="l-lights">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => `<i style="--c:${MEMBER[i % 5]};--d:${((i * 0.37) % 1).toFixed(2)}"></i>`).join('')}</div>
        <div class="l-actions">
          <span class="l-btn fill" data-part="U3">あそぶ</span>
          <div class="l-row"><span class="l-btn" data-part="U4">遊び方</span><span class="l-btn">とは</span></div>
        </div>
        <p class="l-note" data-part="U11">${NOTE}</p>`,
      play: `
        <div class="bg" data-part="U1"><span class="beam" style="--x:15%;--c:#ff4fa8;--r:-12deg"></span><span class="beam" style="--x:85%;--c:#7fd4e8;--r:12deg"></span></div>
        <div class="l-hud" data-part="U5">
          <span class="led"><small>TIME</small><b>1:36</b></span>
          <span class="l-pens">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<i class="${i < 5 ? 'on' : ''}" style="--c:${MEMBER[i % 5]}"></i>`).join('')}</span>
          <span class="led"><small>SCORE</small><b>18420</b></span>
        </div>
        <div class="l-fever" data-part="U8"><span>FEVER</span><i><em></em></i><b>6</b></div>
        ${board('l-board')}
        <div class="l-rescue" data-part="U7"><b>銀テ発射</b><span class="pips"><i></i><i></i><i class="used"></i></span></div>
        <p class="l-note small" data-part="U11">非公式のファン制作（AIぽっぱー）</p>`,
      result: `
        <div class="bg" data-part="U1"><span class="beam" style="--x:50%;--c:#ff4fa8;--r:0deg"></span></div>
        <div class="l-logo small" data-part="U2"><span class="neon-bangs">!!!!!!!</span></div>
        <div class="l-ticket">
          <div class="stub"><small>ADMIT</small><b>ONE</b></div>
          <div class="body">
            <div class="t-head">ろりぽっぷ!!!!!!! 落ちものパズル</div>
            <div data-part="U9"><small>ポップなお祭り度</small><b class="pct">71<span>%</span></b><em>お祭りの真ん中</em></div>
            <dl data-part="U10"><div><dt>SCORE</dt><dd>213,400</dd></div><div><dt>MAX COMBO</dt><dd>23</dd></div><div><dt>FEVER</dt><dd>4</dd></div><div><dt>推し色</dt><dd><i style="background:#cc0000"></i>くるみ</dd></div></dl>
          </div>
        </div>
        <div class="l-actions">
          <span class="l-btn fill" data-part="U3">もう一回</span>
          <div class="l-row"><span class="l-btn" data-part="U4">画像でシェア</span><span class="l-btn">X で投稿</span></div>
        </div>
        <p class="l-note" data-part="U11">${NOTE}</p>`,
    },
  },
  {
    id: 'pop3d',
    name: 'D ポップ 3D カジュアル',
    status: '不採用（参考）',
    concept: '今のパズルゲームの主流の見た目。光の筋が回る青空の背景、厚みと光沢のあるボタン、金の縁取りの盤面、リボンの見出し。結果は星 3 つとランクのバッジ。数字は太い斜体に縁取り。',
    rescueName: 'ボム',
    screens: {
      title: `
        <div class="bg" data-part="U1"><span class="rays"></span><span class="spark" style="left:60px;top:170px"></span><span class="spark" style="left:320px;top:120px"></span><span class="spark big" style="left:300px;top:330px"></span></div>
        <div class="d-logo" data-part="U2"><span class="d-bangs">!!!!!!!</span><span class="d-ribbon">落ちものパズル</span></div>
        <div class="d-peek"><img src="design/board.png" alt=""></div>
        <div class="d-actions">
          <span class="d-btn green" data-part="U3">あそぶ</span>
          <div class="d-row"><span class="d-btn blue" data-part="U4">遊び方</span><span class="d-btn blue">とは</span></div>
        </div>
        <p class="d-note" data-part="U11">${NOTE}</p>`,
      play: `
        <div class="bg" data-part="U1"><span class="rays"></span></div>
        <div class="d-hud" data-part="U5">
          <span class="d-pill"><i class="clock"></i><b>1:36</b></span>
          <span class="d-gauge">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<i class="${i < 5 ? 'on' : ''}" style="--c:${MEMBER[i % 5]}"></i>`).join('')}</span>
          <span class="d-pill"><i class="star"></i><b>18,420</b></span>
        </div>
        <div class="d-fever" data-part="U8"><span>FEVER!</span><i><em></em></i><b>6</b></div>
        ${board('d-board')}
        <div class="d-rescue" data-part="U7"><span class="bomb"></span><b>ボム</b><span class="badge">2</span></div>
        <p class="d-note small" data-part="U11">非公式のファン制作（AIぽっぱー）</p>`,
      result: `
        <div class="bg" data-part="U1"><span class="rays"></span></div>
        <div class="d-result">
          <span class="d-ribbon big" data-part="U2">RESULT</span>
          <div class="d-stars"><i class="on"></i><i class="on big"></i><i></i></div>
          <div data-part="U9" class="d-main"><small>ポップなお祭り度</small><b class="pct">71<span>%</span></b><span class="rank">A</span></div>
          <dl data-part="U10"><div><dt>スコア</dt><dd>213,400</dd></div><div><dt>最大コンボ</dt><dd>23</dd></div><div><dt>フィーバー</dt><dd>4 回</dd></div><div><dt>今日の推し色</dt><dd><i style="background:#cc0000"></i>くるみ</dd></div></dl>
        </div>
        <div class="d-actions">
          <span class="d-btn green" data-part="U3">もう一回</span>
          <div class="d-row"><span class="d-btn blue" data-part="U4">画像でシェア</span><span class="d-btn blue">X で投稿</span></div>
        </div>
        <p class="d-note" data-part="U11">${NOTE}</p>`,
    },
  },
  {
    id: 'stylish',
    name: 'E スタイリッシュ・アニメ系',
    status: '不採用（E+ の元）',
    concept: '最近の音楽ゲーム・アニメ系ゲームの UI。白地にメンバーカラーの差し色、斜めに切ったパネルとボタン、細い線と四隅の括弧、英字の小見出し、傾けた太い数字。結果はランク文字とバーのグラフ。',
    rescueName: 'BOMB',
    screens: stylishScreens(),
  },
];

// E and E+ share the markup; E+ only swaps the color variables (.ui-stylish-plus) and scatters decorations.
function stylishScreens(decos, rescue = 'ボム') {
  const d = (key) => (decos ? deco(decos[key]) : '');
  return {
      title: `
        <div class="bg" data-part="U1"><span class="e-stripes"></span><span class="e-big">LOLLPOP</span>${d('title')}</div>
        <div class="e-logo" data-part="U2"><small>FALLING CANDY PUZZLE</small><span class="e-bangs">!!!!!!!</span><span class="e-name">落ちものパズル</span></div>
        <div class="e-peek" data-corner><img src="design/board.png" alt=""></div>
        <div class="e-actions">
          <span class="e-btn pink" data-part="U3"><small>START</small>あそぶ</span>
          <div class="e-row"><span class="e-btn" data-part="U4"><small>HOW TO</small>遊び方</span><span class="e-btn"><small>ABOUT</small>とは</span></div>
        </div>
        <p class="e-note" data-part="U11">${NOTE}</p>`,
      play: `
        <div class="bg" data-part="U1"><span class="e-stripes small"></span>${d('play')}</div>
        <div class="e-hud" data-part="U5">
          <span class="e-tab"><small>TIME</small><b>1:36</b></span>
          <span class="e-gauge">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<i class="${i < 5 ? 'on' : ''}" style="--c:${MEMBER[i % 5]}"></i>`).join('')}</span>
          <span class="e-tab right"><small>SCORE</small><b>18,420</b></span>
        </div>
        <div class="e-fever" data-part="U8"><span>FEVER</span><i><em></em></i><b>05.4</b></div>
        <div class="e-frame">${board('e-board')}<span class="e-stage">STAGE 01</span></div>
        <div class="e-rescue" data-part="U7"><small>BOMB</small><b>${rescue}</b><span class="segs"><i></i><i></i><i class="used"></i></span></div>
        <p class="e-note small" data-part="U11">非公式のファン制作（AIぽっぱー）</p>`,
      result: `
        <div class="bg" data-part="U1"><span class="e-stripes"></span>${d('result')}</div>
        <div class="e-result">
          <div class="e-rhead" data-part="U2"><span>RESULT</span><small>!!!!!!! 落ちものパズル</small></div>
          <div data-part="U9" class="e-main"><span class="rank">A</span><div><small>POP FESTIVAL</small><b class="pct">71<span>%</span></b><em>ポップなお祭り度<br>お祭りの真ん中</em></div></div>
          <dl data-part="U10">
            <div><dt>SCORE</dt><dd>213,400</dd><i style="--w:71%"></i></div>
            <div><dt>MAX COMBO</dt><dd>23</dd><i style="--w:46%"></i></div>
            <div><dt>FEVER</dt><dd>4</dd><i style="--w:57%"></i></div>
            <div><dt>推し色</dt><dd><em style="background:#cc0000"></em>くるみ</dd><i style="--w:30%;--c:#cc0000"></i></div>
          </dl>
        </div>
        <div class="e-actions">
          <span class="e-btn pink" data-part="U3"><small>RETRY</small>もう一回</span>
          <div class="e-row"><span class="e-btn" data-part="U4"><small>SHARE</small>画像でシェア</span><span class="e-btn"><small>POST</small>X で投稿</span></div>
        </div>
        <p class="e-note" data-part="U11">${NOTE}</p>`,
  };
}

export const UI_CSS = `
.ui { position: relative; width: 390px; height: 844px; overflow: hidden; font-family: "M PLUS Rounded 1c", "Hiragino Maru Gothic ProN", sans-serif; }
.ui .bg { position: absolute; inset: 0; }
.ui img { display: block; width: 100%; }
.ui .bangs { display: inline-flex; gap: 2px; }
.ui .bangs i { font-style: normal; color: var(--c); }
.ui .pips { display: inline-flex; gap: 5px; }
.ui .pips i { width: 11px; height: 11px; border-radius: 50%; }
.ui dl { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; margin: 0; }
.ui dt { font-size: 11px; font-weight: 700; opacity: 0.7; }
.ui dd { margin: 0; font-size: 20px; font-weight: 900; }
.ui dd i { display: inline-block; width: 14px; height: 14px; margin-right: 6px; border-radius: 50%; vertical-align: -1px; }
.ui-tag-box { position: absolute; z-index: 20; outline: 2px dashed rgba(255, 159, 10, 0.95); outline-offset: -1px; border-radius: 4px; pointer-events: none; }
.ui-tag-box span { position: absolute; left: 0; top: 0; padding: 1px 6px; border-radius: 6px; background: #ff9f0a; color: #000; font: 700 13px/1.35 ui-monospace, Menlo, Consolas, monospace; }

/* ---------- A candy ---------- */
.ui-candy { color: #5b2a3f; }
.ui-candy .bg { background: repeating-linear-gradient(135deg, #ffe0ee 0 22px, #fff6fa 22px 44px); }
.ui-candy .c-logo { position: absolute; top: 60px; left: 0; right: 0; text-align: center; }
.ui-candy .c-logo .bangs { font-size: 80px; font-weight: 900; line-height: 1; letter-spacing: -2px; }
.ui-candy .c-logo .bangs i { -webkit-text-stroke: 7px var(--stroke, #fff); paint-order: stroke fill; text-shadow: 0 6px 0 rgba(214, 0, 110, 0.25); }
.ui-candy .c-logo b { display: block; margin-top: 4px; font-size: 42px; font-weight: 900; color: #5b2a3f; -webkit-text-stroke: 8px #fff; paint-order: stroke fill; }
.ui-candy .c-logo.small { top: 36px; }
.ui-candy .c-logo.small .bangs { font-size: 56px; }
.ui-candy .c-wrap { position: absolute; top: 232px; left: 58px; right: 58px; padding: 12px 10px; background: #ff7fb6; border-radius: 26px; color: #fff; text-align: center; font-weight: 800; font-size: 16px; line-height: 1.6; }
.ui-candy .c-wrap::before, .ui-candy .c-wrap::after { content: ""; position: absolute; top: 50%; width: 40px; height: 56px; background: #ff7fb6; transform: translateY(-50%); clip-path: polygon(0 0, 100% 35%, 100% 65%, 0 100%, 22% 75%, 0 50%, 22% 25%); }
.ui-candy .c-wrap::before { left: -34px; transform: translateY(-50%) scaleX(-1); }
.ui-candy .c-wrap::after { right: -34px; }
.ui-candy .c-wrap p { margin: 0; }
.ui-candy .c-peek { position: absolute; top: 340px; left: 50px; right: 50px; height: 190px; overflow: hidden; border: 8px solid #fff; border-radius: 28px; box-shadow: 0 8px 0 #f5b9d4; transform: rotate(-3deg); }
.ui-candy .c-actions { position: absolute; left: 32px; right: 32px; bottom: 96px; display: grid; gap: 14px; }
.ui-candy .c-row { display: grid; grid-template-columns: 1fr 1.4fr; gap: 12px; }
.ui-candy .c-btn { display: block; padding: 18px 8px; border-radius: 999px; background: linear-gradient(#ff8cc3, #ff4f9a); color: #fff; font-size: 26px; font-weight: 900; text-align: center; box-shadow: 0 7px 0 #c42b73, inset 0 4px 0 rgba(255, 255, 255, 0.45); text-shadow: 0 2px 0 #c42b73; }
.ui-candy .c-btn.sub { padding: 13px 6px; background: #fff; color: #e23d8a; font-size: 16px; box-shadow: 0 5px 0 #f5b9d4; text-shadow: none; }
.ui-candy .c-note { position: absolute; left: 24px; right: 24px; bottom: 20px; margin: 0; font-size: 11px; line-height: 1.6; text-align: center; color: #8d5a70; }
.ui-candy .c-note.small { bottom: 12px; }
.ui-candy .c-hud { position: absolute; top: 18px; left: 14px; right: 14px; display: flex; justify-content: space-between; align-items: center; }
.ui-candy .c-chip { display: grid; padding: 6px 16px; border-radius: 999px; background: #fff; box-shadow: 0 4px 0 #f5b9d4; text-align: center; line-height: 1.1; }
.ui-candy .c-chip small { font-size: 10px; font-weight: 800; color: #c1668f; }
.ui-candy .c-chip b { font-size: 24px; font-weight: 900; }
.ui-candy .bangs.mini { font-size: 34px; font-weight: 900; }
.ui-candy .bangs.mini i { -webkit-text-stroke: 5px var(--stroke, #fff); paint-order: stroke fill; }
.ui-candy .bangs.on5 i:nth-child(n+6) { color: #f0cddd; }
.ui-candy .c-fever { position: absolute; top: 90px; left: 14px; right: 14px; display: flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 999px; background: #fff; box-shadow: 0 4px 0 #f5b9d4; font-weight: 900; }
.ui-candy .c-fever span { color: #e23d8a; font-size: 14px; }
.ui-candy .c-fever i { flex: 1; height: 16px; border-radius: 8px; background: #fde3ef; overflow: hidden; }
.ui-candy .c-fever em { display: block; width: 68%; height: 100%; border-radius: 8px; background: repeating-linear-gradient(45deg, #ff4f9a 0 10px, #fff 10px 16px, #f5c400 16px 26px, #fff 26px 32px, #7fd4e8 32px 42px, #fff 42px 48px); }
.ui-candy .c-fever b { font-size: 18px; }
.ui-candy .c-board { position: absolute; top: 146px; left: 12px; right: 12px; padding: 0; overflow: hidden; border: 9px solid #fff; border-radius: 30px; box-shadow: 0 8px 0 #f5b9d4; }
.ui-candy .c-rescue { position: absolute; left: 50%; bottom: 44px; display: flex; align-items: center; gap: 10px; padding: 10px 22px 10px 12px; border-radius: 999px; background: #fff; box-shadow: 0 6px 0 #f5b9d4; transform: translateX(-50%); }
.ui-candy .c-bomb { width: 46px; height: 46px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #fff 0 12%, transparent 13%), conic-gradient(#ff4f9a 0 25%, #fff 0 50%, #ff4f9a 0 75%, #fff 0); box-shadow: inset 0 0 0 3px #c42b73; }
.ui-candy .c-rescue b { white-space: nowrap; font-size: 20px; font-weight: 900; color: #e23d8a; }
.ui-candy .c-rescue .pips i { background: #ff4f9a; } .ui-candy .c-rescue .pips i.used { background: #f5d6e4; }
.ui-candy .c-card { position: absolute; top: 118px; left: 26px; right: 26px; padding: 24px 22px 20px; background: #fff; border-radius: 30px; box-shadow: 0 8px 0 #f5b9d4; text-align: center; }
.ui-candy .c-card small { font-size: 15px; font-weight: 900; color: #c1668f; }
.ui-candy .c-card .pct { display: block; font-size: 110px; line-height: 1; font-weight: 900; color: #ff4f9a; -webkit-text-stroke: 6px #ffe0ee; paint-order: stroke fill; }
.ui-candy .c-card .pct span { font-size: 40px; }
.ui-candy .c-card em { display: inline-block; margin: 6px 0 16px; padding: 4px 16px; border-radius: 999px; background: #ff7fb6; color: #fff; font-style: normal; font-weight: 900; }
.ui-candy .c-card dl { text-align: left; }

/* ---------- B matsuri ---------- */
.ui-matsuri { color: #fff3dd; font-family: "M PLUS Rounded 1c", sans-serif; }
.ui-matsuri .bg { background: radial-gradient(120% 60% at 50% 100%, #4a1d45 0%, transparent 70%), linear-gradient(#0c1233, #1d1745 60%, #2d1640); }
.ui-matsuri .fw { position: absolute; width: 90px; height: 90px; border-radius: 50%; background: repeating-conic-gradient(var(--c) 0 3deg, transparent 3deg 15deg); -webkit-mask: radial-gradient(circle, transparent 30%, #000 32% 62%, transparent 64%); mask: radial-gradient(circle, transparent 30%, #000 32% 62%, transparent 64%); opacity: 0.8; }
.ui-matsuri .fw.big { width: 150px; height: 150px; }
.ui-matsuri .m-lanterns { position: absolute; top: 18px; left: 10px; right: 10px; display: flex; justify-content: space-around; }
.ui-matsuri .m-lanterns::before { content: ""; position: absolute; top: 4px; left: -10px; right: -10px; height: 2px; background: #6b4a2a; border-radius: 50%; }
.ui-matsuri .m-lanterns i { position: relative; width: 38px; height: 50px; margin-top: 4px; border-radius: 45%; background: radial-gradient(circle at 50% 45%, #fff8 0 20%, transparent 60%), var(--c); box-shadow: 0 0 22px var(--c); border-top: 5px solid #2a1a10; border-bottom: 5px solid #2a1a10; }
.ui-matsuri .m-noren { position: absolute; top: 96px; left: 18px; right: 18px; height: 200px; }
.ui-matsuri .m-noren .panels { position: absolute; inset: 0; display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; }
.ui-matsuri .m-noren .panels::before { content: ""; position: absolute; top: -8px; left: -8px; right: -8px; height: 10px; background: #6b4a2a; border-radius: 5px; }
.ui-matsuri .m-noren .panels i { background: linear-gradient(transparent 70%, rgba(0, 0, 0, 0.18)), color-mix(in srgb, var(--c) 78%, #1d1745); clip-path: polygon(0 0, 100% 0, 100% 92%, 50% 100%, 0 92%); }
.ui-matsuri .m-noren .text { position: absolute; inset: 0; display: grid; place-content: center; text-align: center; }
.ui-matsuri .m-noren .bangs { font-family: "Dela Gothic One", sans-serif; font-size: 70px; line-height: 1; justify-content: center; }
.ui-matsuri .m-noren .bangs i { color: #fff; -webkit-text-stroke: 8px #1d1745; paint-order: stroke fill; }
.ui-matsuri .m-noren b { font-family: "Dela Gothic One", sans-serif; font-size: 38px; font-weight: 400; color: #fff; -webkit-text-stroke: 8px #1d1745; paint-order: stroke fill; }
.ui-matsuri .m-lead { position: absolute; top: 322px; left: 0; right: 0; margin: 0; text-align: center; font-size: 15px; font-weight: 800; line-height: 1.8; text-shadow: 0 2px 6px #000; }
.ui-matsuri .m-actions { position: absolute; left: 34px; right: 34px; bottom: 100px; display: grid; gap: 14px; }
.ui-matsuri .m-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.ui-matsuri .m-btn { display: block; padding: 14px 8px; border: 3px solid #5a3417; border-radius: 6px; background: linear-gradient(#f3d7a6, #d9a867); color: #3b2210; font-family: "Dela Gothic One", sans-serif; font-size: 20px; text-align: center; box-shadow: 0 5px 0 #5a3417; }
.ui-matsuri .m-btn.red { padding: 18px 8px; border-color: #5a0a10; border-radius: 40px; background: radial-gradient(120% 90% at 50% 30%, #ff6a5c, #c1121f); color: #fff; font-size: 30px; box-shadow: 0 6px 0 #5a0a10, 0 0 28px rgba(255, 90, 70, 0.6); }
.ui-matsuri .m-note { position: absolute; left: 24px; right: 24px; bottom: 20px; margin: 0; font-size: 11px; line-height: 1.6; text-align: center; color: #c9b9d8; }
.ui-matsuri .m-note.small { bottom: 12px; }
.ui-matsuri .m-hud { position: absolute; top: 16px; left: 12px; right: 12px; display: flex; justify-content: space-between; align-items: center; }
.ui-matsuri .m-plaque { display: grid; padding: 4px 14px; border: 3px solid #5a3417; border-radius: 6px; background: linear-gradient(#f3d7a6, #d9a867); color: #3b2210; text-align: center; line-height: 1.1; box-shadow: 0 4px 0 #5a3417; }
.ui-matsuri .m-plaque small { font-size: 10px; font-weight: 800; }
.ui-matsuri .m-plaque b { font-family: "Dela Gothic One", sans-serif; font-size: 22px; font-weight: 400; }
.ui-matsuri .m-mini-lanterns { display: flex; gap: 4px; }
.ui-matsuri .m-mini-lanterns i { width: 15px; height: 21px; border-radius: 45%; background: #3a3052; border-top: 3px solid #2a1a10; border-bottom: 3px solid #2a1a10; }
.ui-matsuri .m-mini-lanterns i.on { background: var(--c); box-shadow: 0 0 10px var(--c); }
.ui-matsuri .m-fever { position: absolute; top: 84px; left: 14px; right: 14px; display: flex; align-items: center; gap: 8px; font-family: "Dela Gothic One", sans-serif; }
.ui-matsuri .m-fever span { font-size: 14px; color: #ffcf4a; text-shadow: 0 0 8px #ff8a00; }
.ui-matsuri .m-fever i { position: relative; flex: 1; height: 8px; border-radius: 4px; background: #3a3052; }
.ui-matsuri .m-fever em { position: absolute; left: 0; top: 0; bottom: 0; width: 68%; border-radius: 4px; background: linear-gradient(90deg, #ff4f2a, #ffcf4a); }
.ui-matsuri .m-fever s { position: absolute; left: 68%; top: 50%; width: 22px; height: 22px; border-radius: 50%; transform: translate(-50%, -50%); background: repeating-conic-gradient(#ffe38a 0 8deg, transparent 8deg 30deg); box-shadow: 0 0 14px #ffb300; }
.ui-matsuri .m-fever b { font-size: 18px; font-weight: 400; }
.ui-matsuri .m-stall { position: absolute; top: 118px; left: 6px; right: 6px; padding: 30px 8px 8px; border-radius: 6px; background: #8a5a2b; box-shadow: 0 6px 0 #4b2e14; }
.ui-matsuri .m-stall::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 30px; background: repeating-linear-gradient(90deg, #d6263b 0 26px, #fff3dd 26px 52px); -webkit-mask: radial-gradient(14px 10px at 13px 100%, transparent 98%, #000) 0 0 / 26px 100%; mask: radial-gradient(14px 10px at 13px 100%, transparent 98%, #000) 0 0 / 26px 100%; border-radius: 6px 6px 0 0; }
.ui-matsuri .m-board { overflow: hidden; border-radius: 2px; }
.ui-matsuri .m-rescue { position: absolute; left: 50%; bottom: 40px; display: flex; align-items: center; gap: 10px; padding: 8px 22px 8px 10px; border: 3px solid #5a3417; border-radius: 999px; background: #1d1745; box-shadow: 0 0 0 3px #d9a867, 0 6px 0 #5a3417; transform: translateX(-50%); font-family: "Dela Gothic One", sans-serif; }
.ui-matsuri .fw-icon { width: 44px; height: 44px; border-radius: 50%; background: repeating-conic-gradient(#ffcf4a 0 10deg, #ff7fbf 10deg 20deg, transparent 20deg 36deg); -webkit-mask: radial-gradient(circle, #000 16%, transparent 18% 30%, #000 32% 70%, transparent 72%); mask: radial-gradient(circle, #000 16%, transparent 18% 30%, #000 32% 70%, transparent 72%); }
.ui-matsuri .m-rescue b { font-size: 22px; font-weight: 400; }
.ui-matsuri .m-rescue .pips i { background: #ffcf4a; box-shadow: 0 0 6px #ffcf4a; } .ui-matsuri .m-rescue .pips i.used { background: #3a3052; box-shadow: none; }
.ui-matsuri .m-mikuji { position: absolute; top: 100px; left: 34px; right: 34px; padding: 0 20px 20px; background: #fffaf0; color: #3b2210; border: 4px solid #c1121f; box-shadow: 0 0 0 6px #fffaf0, 0 10px 30px rgba(0, 0, 0, 0.5); text-align: center; }
.ui-matsuri .m-mikuji .head { margin: 0 -20px 12px; padding: 8px; background: #c1121f; color: #fff; font-family: "Dela Gothic One", sans-serif; font-size: 22px; letter-spacing: 0.2em; }
.ui-matsuri .m-mikuji .main { position: relative; }
.ui-matsuri .m-mikuji small { font-size: 15px; font-weight: 900; }
.ui-matsuri .m-mikuji .pct { display: block; font-family: "Dela Gothic One", sans-serif; font-size: 100px; line-height: 1.05; font-weight: 400; color: #c1121f; }
.ui-matsuri .m-mikuji .pct span { font-size: 36px; }
.ui-matsuri .m-mikuji .hanko { position: absolute; right: -6px; top: 26px; display: grid; place-items: center; width: 66px; height: 66px; border: 4px solid #d6263b; border-radius: 50%; color: #d6263b; font-family: "Dela Gothic One", sans-serif; font-size: 15px; transform: rotate(12deg); }
.ui-matsuri .m-mikuji dl { margin-top: 12px; padding-top: 12px; border-top: 2px dashed #d9a867; text-align: left; }

/* ---------- C live ---------- */
.ui-live { color: #f4ecff; font-family: "M PLUS Rounded 1c", sans-serif; }
.ui-live .bg { background: radial-gradient(90% 30% at 50% 102%, #3b1030, transparent 70%), #07060b; }
.ui-live .beam { position: absolute; top: -40px; left: var(--x); width: 180px; height: 780px; transform: translateX(-50%) rotate(var(--r)); transform-origin: 50% 0; background: linear-gradient(color-mix(in srgb, var(--c) 55%, transparent), transparent 85%); clip-path: polygon(45% 0, 55% 0, 100% 100%, 0 100%); filter: blur(6px); opacity: 0.55; }
.ui-live .l-logo { position: absolute; top: 110px; left: 0; right: 0; text-align: center; }
.ui-live .neon-bangs { display: block; font-family: "Dela Gothic One", sans-serif; font-size: 84px; line-height: 1; color: #ffe6f3; text-shadow: 0 0 6px #ff4fa8, 0 0 18px #ff4fa8, 0 0 42px #d6006e; }
.ui-live .l-logo b { display: block; margin-top: 6px; font-family: "Dela Gothic One", sans-serif; font-size: 38px; font-weight: 400; color: #e6fbff; text-shadow: 0 0 6px #35d6ff, 0 0 20px #00a2ff; }
.ui-live .l-logo small { display: block; margin-top: 10px; font-size: 12px; font-weight: 800; letter-spacing: 0.3em; color: #9f8fbf; }
.ui-live .l-logo.small { top: 40px; }
.ui-live .l-logo.small .neon-bangs { font-size: 56px; }
.ui-live .l-lights { position: absolute; top: 400px; left: 0; right: 0; height: 110px; display: flex; justify-content: space-evenly; align-items: flex-end; }
.ui-live .l-lights i { width: 8px; height: 70px; border-radius: 4px; background: var(--c); box-shadow: 0 0 12px var(--c), 0 0 26px var(--c); transform: rotate(calc((var(--d) - 0.5) * 50deg)); transform-origin: 50% 100%; }
.ui-live .l-actions { position: absolute; left: 34px; right: 34px; bottom: 100px; display: grid; gap: 14px; }
.ui-live .l-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.ui-live .l-btn { display: block; padding: 13px 8px; border: 2px solid #ff7cc4; border-radius: 999px; color: #ffd9ee; font-size: 17px; font-weight: 900; text-align: center; box-shadow: 0 0 12px #ff4fa8, inset 0 0 12px rgba(255, 79, 168, 0.6); }
.ui-live .l-btn.fill { padding: 18px 8px; background: #ff3d9a; color: #fff; font-family: "Dela Gothic One", sans-serif; font-size: 28px; font-weight: 400; letter-spacing: 0.1em; box-shadow: 0 0 20px #ff4fa8, 0 0 50px rgba(255, 61, 154, 0.6); }
.ui-live .l-note { position: absolute; left: 24px; right: 24px; bottom: 20px; margin: 0; font-size: 11px; line-height: 1.6; text-align: center; color: #8f84a8; }
.ui-live .l-note.small { bottom: 12px; }
.ui-live .l-hud { position: absolute; top: 16px; left: 10px; right: 10px; display: flex; justify-content: space-between; align-items: center; }
.ui-live .led { display: grid; min-width: 104px; padding: 4px 10px; border-radius: 4px; background: #000; box-shadow: inset 0 0 0 2px #2b2540; line-height: 1.1; }
.ui-live .led small { font-size: 9px; font-weight: 800; letter-spacing: 0.2em; color: #8f84a8; }
.ui-live .led b { font-family: ui-monospace, Consolas, monospace; font-size: 26px; color: #ffcf4a; text-shadow: 0 0 8px #ff9d00; letter-spacing: 0.06em; }
.ui-live .l-pens { display: flex; gap: 6px; align-items: flex-end; height: 40px; }
.ui-live .l-pens i { width: 6px; height: 34px; border-radius: 3px; background: #2b2540; }
.ui-live .l-pens i.on { background: var(--c); box-shadow: 0 0 10px var(--c); }
.ui-live .l-fever { position: absolute; top: 80px; left: 14px; right: 14px; display: flex; align-items: center; gap: 10px; font-family: "Dela Gothic One", sans-serif; }
.ui-live .l-fever span { color: #ffe6f3; text-shadow: 0 0 8px #ff4fa8, 0 0 16px #ff4fa8; }
.ui-live .l-fever i { flex: 1; height: 14px; border-radius: 7px; background: #1b1628; overflow: hidden; }
.ui-live .l-fever em { display: block; width: 68%; height: 100%; background: linear-gradient(90deg, #cc0000, #f5c400, #7fd4e8, #2e9e5b, #fff); box-shadow: 0 0 14px #ff4fa8; }
.ui-live .l-fever b { font-size: 30px; font-weight: 400; color: #fff; text-shadow: 0 0 10px #ff4fa8; }
.ui-live .l-board { position: absolute; top: 112px; left: 10px; right: 10px; overflow: hidden; border-radius: 10px; box-shadow: 0 0 0 2px #ff7cc4, 0 0 22px rgba(255, 79, 168, 0.7), 0 0 60px rgba(127, 212, 232, 0.25); }
.ui-live .l-rescue { position: absolute; left: 50%; bottom: 40px; display: flex; align-items: center; gap: 12px; padding: 12px 24px; border-radius: 999px; background: linear-gradient(120deg, #9aa0ad, #f7f8fb 35%, #a9afbb 55%, #eef0f4 75%, #8c93a0); color: #1b1628; box-shadow: 0 0 18px rgba(255, 255, 255, 0.45); transform: translateX(-50%); }
.ui-live .l-rescue b { font-family: "Dela Gothic One", sans-serif; font-size: 21px; font-weight: 400; }
.ui-live .l-rescue .pips i { background: #ff3d9a; } .ui-live .l-rescue .pips i.used { background: #c3c7d0; }
.ui-live .l-ticket { position: absolute; top: 132px; left: 18px; right: 18px; display: grid; grid-template-columns: 64px 1fr; background: #fdf7ff; color: #1b1628; border-radius: 12px; box-shadow: 0 0 30px rgba(255, 79, 168, 0.45); overflow: hidden; }
.ui-live .l-ticket .stub { display: grid; place-content: center; gap: 4px; background: #ff3d9a; color: #fff; text-align: center; border-right: 3px dashed #fdf7ff; writing-mode: vertical-rl; font-family: "Dela Gothic One", sans-serif; letter-spacing: 0.2em; }
.ui-live .l-ticket .stub small { font-size: 14px; } .ui-live .l-ticket .stub b { font-size: 22px; font-weight: 400; }
.ui-live .l-ticket .body { padding: 16px 18px; }
.ui-live .t-head { padding-bottom: 8px; border-bottom: 2px solid #1b1628; font-size: 13px; font-weight: 900; letter-spacing: 0.04em; }
.ui-live .l-ticket small { display: block; margin-top: 10px; font-size: 14px; font-weight: 900; }
.ui-live .l-ticket .pct { display: block; font-family: "Dela Gothic One", sans-serif; font-size: 96px; line-height: 1; font-weight: 400; color: #ff3d9a; }
.ui-live .l-ticket .pct span { font-size: 34px; }
.ui-live .l-ticket em { font-style: normal; font-weight: 900; }
.ui-live .l-ticket dl { margin-top: 14px; }

/* ---------- D pop 3d ---------- */
.ui-pop3d { color: #fff; font-family: "M PLUS Rounded 1c", sans-serif; }
.ui-pop3d .bg { overflow: hidden; background: radial-gradient(90% 60% at 50% 35%, #6fd3ff, #2a8cf0 55%, #1b4fc4); }
.ui-pop3d .rays { position: absolute; left: 50%; top: 32%; width: 1200px; height: 1200px; transform: translate(-50%, -50%); background: repeating-conic-gradient(rgba(255, 255, 255, 0.13) 0 9deg, transparent 9deg 22deg); -webkit-mask: radial-gradient(circle, #000 10%, transparent 60%); mask: radial-gradient(circle, #000 10%, transparent 60%); }
.ui-pop3d .spark { position: absolute; width: 16px; height: 16px; background: #fff; clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%); filter: drop-shadow(0 0 6px #fff); }
.ui-pop3d .spark.big { width: 26px; height: 26px; }
.ui-pop3d .d-logo { position: absolute; top: 70px; left: 0; right: 0; text-align: center; }
.ui-pop3d .d-bangs { display: block; font-family: "Dela Gothic One", sans-serif; font-size: 92px; line-height: 1; font-style: italic; background: linear-gradient(#fff6a8 20%, #ffc21a 55%, #ff7a00); -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-stroke: 3px #10327a; filter: drop-shadow(0 6px 0 #10327a) drop-shadow(0 10px 14px rgba(0, 0, 0, 0.35)); }
.ui-pop3d .d-ribbon { position: relative; display: inline-block; margin-top: 10px; padding: 8px 34px; background: linear-gradient(#ff5a6e, #d81b3f); color: #fff; font-family: "Dela Gothic One", sans-serif; font-size: 30px; -webkit-text-stroke: 5px #7a0a20; paint-order: stroke fill; box-shadow: 0 5px 0 #7a0a20; clip-path: polygon(0 0, 100% 0, 94% 50%, 100% 100%, 0 100%, 6% 50%); }
.ui-pop3d .d-ribbon.big { font-size: 34px; padding: 8px 46px; }
.ui-pop3d .d-peek { position: absolute; top: 300px; left: 60px; right: 60px; height: 210px; overflow: hidden; border-radius: 22px; border: 7px solid #ffd54a; box-shadow: 0 0 0 4px #b36b00, 0 10px 20px rgba(0, 0, 0, 0.35); transform: rotate(3deg); }
.ui-pop3d .d-actions { position: absolute; left: 30px; right: 30px; bottom: 96px; display: grid; gap: 14px; }
.ui-pop3d .d-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.ui-pop3d .d-btn { display: block; padding: 14px 8px; border: 4px solid #0f3d8a; border-radius: 20px; background: linear-gradient(#6cc8ff, #2a7de8); font-family: "Dela Gothic One", sans-serif; font-size: 19px; text-align: center; color: #fff; -webkit-text-stroke: 4px #0f3d8a; paint-order: stroke fill; box-shadow: inset 0 6px 0 rgba(255, 255, 255, 0.45), inset 0 -6px 0 rgba(0, 0, 0, 0.15), 0 6px 0 #0f3d8a; }
.ui-pop3d .d-btn.green { padding: 18px 8px; border-color: #1f5e0c; background: linear-gradient(#a6f25a, #43b51c); font-size: 32px; -webkit-text-stroke: 6px #1f5e0c; box-shadow: inset 0 7px 0 rgba(255, 255, 255, 0.5), inset 0 -8px 0 rgba(0, 0, 0, 0.15), 0 7px 0 #1f5e0c, 0 12px 18px rgba(0, 0, 0, 0.3); }
.ui-pop3d .d-note { position: absolute; left: 24px; right: 24px; bottom: 20px; margin: 0; font-size: 11px; line-height: 1.6; text-align: center; color: #e3f2ff; text-shadow: 0 1px 2px #10327a; }
.ui-pop3d .d-note.small { bottom: 12px; }
.ui-pop3d .d-hud { position: absolute; top: 16px; left: 10px; right: 10px; display: flex; justify-content: space-between; align-items: center; }
.ui-pop3d .d-pill { display: flex; align-items: center; gap: 6px; padding: 4px 14px 4px 4px; border: 3px solid #0f3d8a; border-radius: 999px; background: linear-gradient(#1a4fb0, #0f3380); box-shadow: 0 4px 0 #0a2560; }
.ui-pop3d .d-pill b { font-family: "Dela Gothic One", sans-serif; font-size: 22px; font-style: italic; font-weight: 400; }
.ui-pop3d .d-pill .clock, .ui-pop3d .d-pill .star { width: 32px; height: 32px; border-radius: 50%; background: radial-gradient(circle at 40% 35%, #fff9c0, #ffb300); box-shadow: inset 0 -3px 0 rgba(0, 0, 0, 0.2); }
.ui-pop3d .d-pill .star { border-radius: 0; clip-path: polygon(50% 0, 63% 35%, 100% 38%, 72% 60%, 81% 100%, 50% 78%, 19% 100%, 28% 60%, 0 38%, 37% 35%); }
.ui-pop3d .d-gauge { display: flex; gap: 3px; padding: 4px; border: 3px solid #0f3d8a; border-radius: 999px; background: #0f3380; }
.ui-pop3d .d-gauge i { width: 11px; height: 22px; border-radius: 6px; background: #2b4f99; }
.ui-pop3d .d-gauge i.on { background: linear-gradient(rgba(255, 255, 255, 0.6), transparent 50%), var(--c); }
.ui-pop3d .d-fever { position: absolute; top: 76px; left: 14px; right: 14px; display: flex; align-items: center; gap: 8px; }
.ui-pop3d .d-fever span { font-family: "Dela Gothic One", sans-serif; font-size: 22px; font-style: italic; color: #ffe14a; -webkit-text-stroke: 4px #b3002d; paint-order: stroke fill; }
.ui-pop3d .d-fever i { flex: 1; height: 18px; padding: 3px; border: 3px solid #0f3d8a; border-radius: 12px; background: #0f3380; }
.ui-pop3d .d-fever em { display: block; width: 68%; height: 100%; border-radius: 8px; background: linear-gradient(rgba(255, 255, 255, 0.55), transparent 55%), linear-gradient(90deg, #ff3b6b, #ffb300, #ffe14a); }
.ui-pop3d .d-fever b { font-family: "Dela Gothic One", sans-serif; font-size: 28px; font-style: italic; font-weight: 400; -webkit-text-stroke: 4px #0f3d8a; paint-order: stroke fill; }
.ui-pop3d .d-board { position: absolute; top: 116px; left: 8px; right: 8px; overflow: hidden; border: 7px solid #ffd54a; border-radius: 22px; box-shadow: 0 0 0 4px #b36b00, 0 8px 0 #7a4800, inset 0 0 20px rgba(0, 0, 0, 0.5); }
.ui-pop3d .d-rescue { position: absolute; left: 50%; bottom: 38px; display: flex; align-items: center; gap: 10px; padding: 8px 26px 8px 10px; border: 4px solid #7a0a20; border-radius: 999px; background: linear-gradient(#ff6a7e, #d81b3f); box-shadow: inset 0 5px 0 rgba(255, 255, 255, 0.4), 0 6px 0 #7a0a20; transform: translateX(-50%); }
.ui-pop3d .bomb { position: relative; width: 42px; height: 42px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #777 0 12%, #222 45%); }
.ui-pop3d .bomb::after { content: ""; position: absolute; right: -2px; top: -8px; width: 14px; height: 14px; background: #ffe14a; clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%); filter: drop-shadow(0 0 4px #ffb300); }
.ui-pop3d .d-rescue b { font-family: "Dela Gothic One", sans-serif; font-size: 24px; font-weight: 400; -webkit-text-stroke: 4px #7a0a20; paint-order: stroke fill; }
.ui-pop3d .d-rescue .badge { position: absolute; right: -8px; top: -10px; display: grid; place-items: center; width: 30px; height: 30px; border: 3px solid #fff; border-radius: 50%; background: #1b4fc4; font-weight: 900; }
.ui-pop3d .d-result { position: absolute; top: 40px; left: 22px; right: 22px; padding: 0 20px 20px; border: 5px solid #0f3d8a; border-radius: 26px; background: linear-gradient(#fffdf2, #ffe9b8); color: #10327a; text-align: center; box-shadow: 0 8px 0 #0f3d8a, 0 16px 26px rgba(0, 0, 0, 0.3); }
.ui-pop3d .d-result .d-ribbon { margin-top: -22px; }
.ui-pop3d .d-stars { display: flex; justify-content: center; align-items: flex-end; gap: 6px; margin: 10px 0 2px; }
.ui-pop3d .d-stars i { width: 54px; height: 54px; background: #c9c1a5; clip-path: polygon(50% 0, 63% 35%, 100% 38%, 72% 60%, 81% 100%, 50% 78%, 19% 100%, 28% 60%, 0 38%, 37% 35%); }
.ui-pop3d .d-stars i.big { width: 72px; height: 72px; }
.ui-pop3d .d-stars i.on { background: radial-gradient(circle at 45% 35%, #fff9c0, #ffb300 60%); }
.ui-pop3d .d-main { position: relative; }
.ui-pop3d .d-main small { font-size: 14px; font-weight: 900; }
.ui-pop3d .d-main .pct { display: block; font-family: "Dela Gothic One", sans-serif; font-size: 96px; line-height: 1; font-style: italic; font-weight: 400; color: #ff3b6b; -webkit-text-stroke: 5px #fff; paint-order: stroke fill; filter: drop-shadow(0 4px 0 #b3002d); }
.ui-pop3d .d-main .pct span { font-size: 36px; }
.ui-pop3d .d-main .rank { position: absolute; right: -4px; top: 14px; display: grid; place-items: center; width: 64px; height: 70px; background: linear-gradient(#ffe14a, #ff9d00); clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%); font-family: "Dela Gothic One", sans-serif; font-size: 34px; color: #fff; -webkit-text-stroke: 4px #b36b00; paint-order: stroke fill; }
.ui-pop3d .d-result dl { margin-top: 12px; padding: 12px; border-radius: 14px; background: rgba(16, 50, 122, 0.08); text-align: left; }

/* ---------- E stylish (colors are variables so E+ can swap them) ---------- */
.ui-stylish {
  --ink: #14161f; --paper: #f7f8fc; --card: #fff; --paper-lines: rgba(20, 22, 31, 0.05); --outline: rgba(20, 22, 31, 0.12);
  --accent: #ff2e88; --accent-soft: #ffd1e6; --accent-on-ink: #ff7cb8; --muted: #8a8fa3; --muted-2: #6b7086;
  --track: #dfe2ec; --seg: #f5c400; --seg-used: #3a3d4d; --fever-bar: linear-gradient(90deg, #ff2e88, #f5c400);
  --stripe-1: #cc0000; --stripe-2: #f5c400; --stripe-3: #7fd4e8; --stripe-4: #2e9e5b; --stripe-5: #ff2e88; --stripe-opacity: 0.9;
  --drop: transparent;
  color: var(--ink); font-family: "M PLUS Rounded 1c", sans-serif;
}
.ui-stylish .bg { overflow: hidden; background: linear-gradient(var(--paper-lines) 1px, transparent 1px) 0 0 / 100% 24px, linear-gradient(90deg, var(--paper-lines) 1px, transparent 1px) 0 0 / 24px 100%, var(--paper); }
.ui-stylish .e-stripes { position: absolute; right: -80px; top: -40px; width: 300px; height: 520px; background: linear-gradient(90deg, var(--stripe-1) 0 16%, transparent 16% 20%, var(--stripe-2) 20% 36%, transparent 36% 40%, var(--stripe-3) 40% 56%, transparent 56% 60%, var(--stripe-4) 60% 76%, transparent 76% 80%, var(--stripe-5) 80%); transform: skewX(-24deg); opacity: var(--stripe-opacity); }
.ui-stylish .e-stripes.small { width: 160px; height: 110px; opacity: 0.6; }
.ui-stylish .e-big { position: absolute; left: -20px; bottom: 150px; font-family: "Dela Gothic One", sans-serif; font-size: 110px; color: transparent; -webkit-text-stroke: 1.5px var(--outline); transform: rotate(-90deg) translateX(-100%); transform-origin: 0 0; white-space: nowrap; }
.ui-stylish .e-logo { position: absolute; top: 64px; left: 30px; right: 30px; }
.ui-stylish .e-logo small { display: block; font-size: 12px; font-weight: 900; letter-spacing: 0.3em; color: var(--accent); }
.ui-stylish .e-bangs { display: block; margin-top: 4px; font-family: "Dela Gothic One", sans-serif; font-size: 88px; line-height: 1; color: var(--ink); transform: skewX(-12deg); text-shadow: 6px 6px 0 var(--accent); }
.ui-stylish .e-name { display: inline-block; margin-top: 12px; padding: 6px 22px; background: var(--ink); color: #fff; font-family: "Dela Gothic One", sans-serif; font-size: 30px; clip-path: polygon(6% 0, 100% 0, 94% 100%, 0 100%); }
.ui-stylish .e-peek { position: absolute; top: 330px; left: 30px; right: 30px; height: 180px; overflow: hidden; clip-path: polygon(8% 0, 100% 0, 92% 100%, 0 100%); }
.ui-stylish .e-actions { position: absolute; left: 30px; right: 30px; bottom: 96px; display: grid; gap: 12px; filter: drop-shadow(4px 5px 0 var(--drop)); }
.ui-stylish .e-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.ui-stylish .e-btn { position: relative; display: grid; padding: 10px 18px; background: var(--card); color: var(--ink); font-size: 17px; font-weight: 900; clip-path: polygon(8% 0, 100% 0, 92% 100%, 0 100%); box-shadow: inset 0 0 0 2px var(--ink); text-align: center; }
.ui-stylish .e-btn small { font-size: 10px; letter-spacing: 0.25em; color: var(--muted); }
.ui-stylish .e-btn.pink { padding: 14px 18px; background: var(--accent); color: #fff; font-family: "Dela Gothic One", sans-serif; font-size: 30px; font-weight: 400; box-shadow: none; clip-path: polygon(4% 0, 100% 0, 96% 100%, 0 100%); }
.ui-stylish .e-btn.pink small { color: var(--accent-soft); font-family: "M PLUS Rounded 1c", sans-serif; font-weight: 900; }
.ui-stylish .e-btn.pink::after { content: ""; position: absolute; right: 30px; top: 50%; width: 14px; height: 18px; background: #fff; clip-path: polygon(0 0, 100% 50%, 0 100%); transform: translateY(-50%); }
.ui-stylish .e-note { position: absolute; left: 24px; right: 24px; bottom: 20px; margin: 0; font-size: 11px; line-height: 1.6; text-align: center; color: var(--muted-2); }
.ui-stylish .e-note.small { bottom: 12px; }
.ui-stylish .e-hud { position: absolute; top: 14px; left: 0; right: 0; display: flex; justify-content: space-between; align-items: center; }
.ui-stylish .e-tab { display: grid; min-width: 118px; padding: 4px 20px 4px 14px; background: var(--ink); color: #fff; clip-path: polygon(0 0, 100% 0, 88% 100%, 0 100%); line-height: 1.1; }
.ui-stylish .e-tab.right { padding: 4px 14px 4px 22px; text-align: right; clip-path: polygon(12% 0, 100% 0, 100% 100%, 0 100%); }
.ui-stylish .e-tab small { font-size: 9px; font-weight: 900; letter-spacing: 0.25em; color: var(--accent-on-ink); }
.ui-stylish .e-tab b { font-family: "Dela Gothic One", sans-serif; font-size: 24px; font-weight: 400; transform: skewX(-10deg); }
.ui-stylish .e-gauge { display: flex; gap: 3px; }
.ui-stylish .e-gauge i { width: 12px; height: 26px; background: var(--track); transform: skewX(-18deg); }
.ui-stylish .e-gauge i.on { background: var(--c); box-shadow: inset 0 0 0 1px var(--outline); }
.ui-stylish .e-fever { position: absolute; top: 70px; left: 12px; right: 12px; display: flex; align-items: center; gap: 8px; }
.ui-stylish .e-fever span { padding: 2px 14px; background: var(--accent); color: #fff; font-family: "Dela Gothic One", sans-serif; font-size: 15px; clip-path: polygon(10% 0, 100% 0, 90% 100%, 0 100%); }
.ui-stylish .e-fever i { flex: 1; height: 10px; background: var(--track); transform: skewX(-24deg); }
.ui-stylish .e-fever em { display: block; width: 68%; height: 100%; background: var(--fever-bar); }
.ui-stylish .e-fever b { font-family: "Dela Gothic One", sans-serif; font-size: 26px; font-weight: 400; transform: skewX(-10deg); }
.ui-stylish .e-frame { position: absolute; top: 100px; left: 12px; right: 12px; padding: 8px; }
.ui-stylish .e-frame::before, .ui-stylish .e-frame::after { content: ""; position: absolute; width: 28px; height: 28px; border: 3px solid var(--ink); }
.ui-stylish .e-frame::before { left: 0; top: 0; border-right: 0; border-bottom: 0; }
.ui-stylish .e-frame::after { right: 0; bottom: 0; border-left: 0; border-top: 0; }
.ui-stylish .e-stage { position: absolute; left: 36px; bottom: -8px; padding: 0 8px; background: var(--paper); font-size: 10px; font-weight: 900; letter-spacing: 0.25em; }
.ui-stylish .e-board { overflow: hidden; }
.ui-stylish .e-rescue { position: absolute; left: 50%; bottom: 36px; display: grid; grid-template-columns: auto auto; column-gap: 12px; align-items: center; padding: 6px 30px; background: var(--ink); color: #fff; clip-path: polygon(6% 0, 100% 0, 94% 100%, 0 100%); transform: translateX(-50%); }
.ui-stylish .e-rescue small { grid-column: 1; font-size: 9px; font-weight: 900; letter-spacing: 0.25em; color: var(--accent-on-ink); }
.ui-stylish .e-rescue b { grid-column: 1; font-family: "Dela Gothic One", sans-serif; font-size: 22px; font-weight: 400; }
.ui-stylish .e-rescue .segs { grid-column: 2; grid-row: 1 / 3; display: flex; gap: 4px; }
.ui-stylish .e-rescue .segs i { width: 12px; height: 22px; background: var(--seg); transform: skewX(-18deg); }
.ui-stylish .e-rescue .segs i.used { background: var(--seg-used); }
.ui-stylish .e-result { position: absolute; top: 40px; left: 22px; right: 22px; }
.ui-stylish .e-rhead span { display: block; font-family: "Dela Gothic One", sans-serif; font-size: 62px; line-height: 1; color: transparent; -webkit-text-stroke: 2px var(--ink); transform: skewX(-10deg); }
.ui-stylish .e-rhead small { display: inline-block; margin-top: 4px; padding: 2px 12px; background: var(--ink); color: #fff; font-size: 12px; font-weight: 900; }
.ui-stylish .e-main { display: flex; align-items: center; gap: 16px; margin-top: 16px; padding: 14px 18px; background: var(--card); clip-path: polygon(4% 0, 100% 0, 96% 100%, 0 100%); box-shadow: inset 0 0 0 2px var(--ink); }
.ui-stylish .e-main .rank { font-family: "Dela Gothic One", sans-serif; font-size: 110px; line-height: 1; color: var(--accent); transform: skewX(-12deg); text-shadow: 5px 5px 0 var(--ink); }
.ui-stylish .e-main small { font-size: 11px; font-weight: 900; letter-spacing: 0.25em; color: var(--muted); }
.ui-stylish .e-main .pct { display: block; font-family: "Dela Gothic One", sans-serif; font-size: 58px; line-height: 1; font-weight: 400; transform: skewX(-10deg); }
.ui-stylish .e-main .pct span { font-size: 24px; }
.ui-stylish .e-main em { font-style: normal; font-size: 12px; font-weight: 800; }
.ui-stylish .e-result dl { display: grid; grid-template-columns: 1fr; gap: 10px; margin-top: 16px; padding: 12px 16px; background: var(--card); box-shadow: inset 0 0 0 2px var(--ink); }
.ui-stylish .e-result dl div { display: grid; grid-template-columns: 110px 1fr; align-items: baseline; padding-bottom: 6px; border-bottom: 1px solid var(--ink); position: relative; }
.ui-stylish .e-result dt { font-size: 11px; letter-spacing: 0.18em; opacity: 1; color: var(--muted-2); }
.ui-stylish .e-result dd { font-family: "Dela Gothic One", sans-serif; font-size: 22px; font-weight: 400; text-align: right; }
.ui-stylish .e-result dd em { display: inline-block; width: 14px; height: 14px; margin-right: 6px; border-radius: 50%; }
.ui-stylish .e-result dl div i { position: absolute; left: 0; bottom: -2px; width: var(--w); height: 3px; background: var(--c, var(--accent)); }

/* ---------- E+ cute stylish: same shapes, lollpop colors ---------- */
.ui-stylish.ui-stylish-plus {
  --ink: #3b1f35; --paper: #fff3f8; --card: #fff; --paper-lines: rgba(255, 79, 154, 0.12); --outline: rgba(59, 31, 53, 0.14);
  --accent: #ff4f9a; --accent-soft: #ffd6e8; --accent-on-ink: #ff9ec8; --muted: #b07a98; --muted-2: #8d5a78;
  --track: #f6d9e7; --seg: #ff7fb6; --seg-used: #5a3a52; --fever-bar: linear-gradient(90deg, #ff4f9a, #ff9ec8 55%, #ffd44d);
  --stripe-1: #ec6f80; --stripe-2: #ffd96a; --stripe-3: #a8e2f0; --stripe-4: #7fcb9d; --stripe-5: #ffb3d1; --stripe-opacity: 0.85;
  --drop: #ffb3d1;
}
.ui-stylish-plus .e-deco { position: absolute; width: var(--s); height: var(--s); color: var(--c); transform: rotate(var(--r)); font-style: normal; }
.ui-stylish-plus .e-deco svg { display: block; width: 100%; height: 100%; fill: currentColor; }
.ui-stylish-plus .e-deco.bang { width: auto; font-family: "Dela Gothic One", sans-serif; font-size: var(--s); line-height: 1; transform: rotate(var(--r)) skewX(-12deg); }
`;

// Tag every [data-part] inside a mock with an orange box, in the mock's own (unscaled) coordinates.
export function tagParts(mock, scale) {
  const base = mock.getBoundingClientRect();
  const seen = new Set();
  for (const el of mock.querySelectorAll('[data-part]')) {
    const id = el.dataset.part;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const box = document.createElement('div');
    box.className = 'ui-tag-box';
    Object.assign(box.style, {
      left: `${(r.left - base.left) / scale}px`,
      top: `${(r.top - base.top) / scale}px`,
      width: `${r.width / scale}px`,
      height: `${r.height / scale}px`,
    });
    if (!seen.has(id)) box.innerHTML = `<span>${id}</span>`;
    seen.add(id);
    mock.append(box);
  }
}
