// Google Apps Script Web アプリ URL を設定
// doGet() で GET リクエストに対して JSON (CORS 許可済) を返すよう実装しています
const API_URL =
  'https://script.google.com/macros/s/AKfycbYHdZdMHbTD9155j0wt0vjTPJ46vDNKHN_uZ1N7WsPGc3BZ2mbfXBE5-oHnKwys0KkkJA/exec';

let state = 'dashboard';

window.addEventListener('DOMContentLoaded', () => {
  render();
  loadAndSum();
});

// 画面描写切り替え
function render() {
  const app = document.getElementById('app');
  app.innerHTML = '';
  if (state === 'dashboard') {
    renderDashboard(app);
  } else if (state === 'entry') {
    renderEntry(app);
  }
}

// ダッシュボード画面
function renderDashboard(root) {
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <h2>今月の集計状況3</h2>
    <p>子どもA: ¥<span id="sumA">0</span></p>
    <p>子どもB: ¥<span id="sumB">0</span></p>
  `;
  root.appendChild(card);

  const btnEntry = document.createElement('button');
  btnEntry.textContent = '入力画面へ';
  btnEntry.onclick = () => { state = 'entry'; render(); };
  root.appendChild(btnEntry);
}

// 入力画面
function renderEntry(root) {
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <h2>毎日の入力</h2>
    <label><input type="radio" name="child" value="A" checked/> 子どもA</label>
    <label><input type="radio" name="child" value="B"/> 子どもB</label>

    <label><input type="checkbox" id="early"/> 早寝（+10円）</label>
    <label><input type="checkbox" id="late"/> 遅寝（-10円）</label>

    <label><input type="checkbox" id="chore"/> お手伝い（+10円）</label>
    <input type="text" id="choreDesc" placeholder="その他詳細"/>

    <label><input type="checkbox" id="perfect"/> テスト満点（+100円）</label>
    <select id="subject">
      <option value="">科目を選択</option>
      <option value="国語">国語</option>
      <option value="算数">算数</option>
      <option value="理科">理科</option>
      <option value="社会">社会</option>
      <option value="その他">その他</option>
    </select>
    <input type="text" id="subjectOther" placeholder="その他科目"/>
  `;
  root.appendChild(card);

  const btnSave = document.createElement('button');
  btnSave.textContent = '保存';
  btnSave.onclick = submitEntry;
  root.appendChild(btnSave);

  const btnBack = document.createElement('button');
  btnBack.textContent = 'ダッシュボードへ';
  btnBack.className = 'outline';
  btnBack.onclick = () => { state = 'dashboard'; loadAndSum(); render(); };
  root.appendChild(btnBack);
}

// データ送信 (POST)
function submitEntry() {
  const data = {
    date: new Date().toISOString().split('T')[0],
    child: document.querySelector('input[name="child"]:checked').value,
    isEarly: document.getElementById('early').checked,
    isLate: document.getElementById('late').checked,
    isChore: document.getElementById('chore').checked,
    choreDesc: document.getElementById('choreDesc').value,
    isPerfectScore: document.getElementById('perfect').checked,
    testSubject: document.getElementById('subject').value,
    testSubjectOther: document.getElementById('subjectOther').value
  };
  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(res => res.json())
  .then(json => {
    if (json.success) alert('保存しました');
    state = 'dashboard';
    render();
    loadAndSum();
  })
  .catch(err => console.error('保存エラー', err));
}

// 集計読み込み (GET)
function loadAndSum() {
  fetch(API_URL)
    .then(res => res.json())
    .then(rows => {
      const sums = { A: 0, B: 0 };
      const thisMonth = new Date().getMonth();
      rows.forEach(row => {
        const date = new Date(row['日付']);
        if (date.getMonth() !== thisMonth) return;
        const child = row['子ども'];
        const early = row['早寝'] ? 10 : 0;
        const late = row['遅寝'] ? -10 : 0;
        const chore = row['お手伝い'] ? 10 : 0;
        const perfect = row['満点'] ? 100 : 0;
        sums[child] += early + late + chore + perfect;
      });
      document.getElementById('sumA').textContent = sums.A;
      document.getElementById('sumB').textContent = sums.B;
    })
    .catch(err => console.error('集計読み込みエラー', err));
}
