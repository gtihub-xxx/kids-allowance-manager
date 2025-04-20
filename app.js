// Google Apps Script Web アプリ URL を設定（POST/GET両対応）
const API_URL =
  'https://script.google.com/macros/s/AKfycbwHQNBsK4n2SAoUxvJ2vAkOPc6hNYa9TSMlcZJUXcnOO9R3dAbRJEjWCo2VmJnQBqHg2Q/exec';

let state = 'dashboard';

window.addEventListener('DOMContentLoaded', () => {
  render();
  loadAndSum();
});

// 画面描画切り替え
function render() {
  const app = document.getElementById('app');
  app.innerHTML = '';
  if (state === 'dashboard') renderDashboard(app);
  else if (state === 'entry') renderEntry(app);
}

// ダッシュボード画面
function renderDashboard(root) {
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <h2>今月の集計状況5</h2>
    <p>子どもA: ¥<span id="sumA">0</span></p>
    <p>子どもB: ¥<span id="sumB">0</span></p>
  `;
  root.appendChild(card);
  const btn = document.createElement('button');
  btn.textContent = '入力画面へ';
  btn.onclick = () => { state='entry'; render(); };
  root.appendChild(btn);
}

// 入力画面
function renderEntry(root) {
  const card = document.createElement('div'); card.className='card';
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
  const btnSave = document.createElement('button'); btnSave.textContent='保存'; btnSave.onclick=submitEntry;
  const btnBack = document.createElement('button'); btnBack.textContent='ダッシュボードへ'; btnBack.className='outline'; btnBack.onclick=()=>{ state='dashboard'; render(); loadAndSum(); };
  root.appendChild(btnSave); root.appendChild(btnBack);
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
    // JSON ではなく text/plain にしてプリフライトを防ぐ
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(data)
  })
  .then(res=>res.json())
  .then(json=>{ if(json.success) alert('保存しました'); state='dashboard'; render(); loadAndSum(); })
  .catch(err=>console.error('保存エラー',err));
}

// JSONP コールバック
window.handleSheetData = function(response) {
  const rows = response.table.rows;
  const sums = { A:0, B:0 };
  const thisMonth = new Date().getMonth();
  rows.forEach(r=>{
    const date = new Date(r.c[0].v);
    if(date.getMonth()!==thisMonth) return;
    const child = r.c[1].v;
    sums[child] += (r.c[2].v?10:0) + (r.c[3].v?-10:0) + (r.c[4].v?10:0) + (r.c[6].v?100:0);
  });
  document.getElementById('sumA').textContent=sums.A;
  document.getElementById('sumB').textContent=sums.B;
  // クリーンアップ
  const sc = document.getElementById('jsonpScript'); if(sc) sc.remove(); delete window.handleSheetData;
};

// 集計読み込み (JSONP)
function loadAndSum() {
  const script = document.createElement('script');
  script.id='jsonpScript';
  script.src=
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vR_SCwi7DK8HEY2JiKzmAtlO0FsJOMA3AidTjlJ_CcrgYGGISaolllVFxBWiVtbk4C5R73-lcqv2hvT/gviz/tq?gid=0&tqx=out:jsonp;responseHandler:handleSheetData';
  document.body.appendChild(script);
}
