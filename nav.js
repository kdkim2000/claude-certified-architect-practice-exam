/* Shared top navigation: 섹션별 학습 · Task별 학습 · 가이드 학습 · 모의고사. Loaded right after <body> on every page. */
(function () {
  var path = location.pathname.split("/").pop() || "index.html";
  var page = /study/.test(path) ? "study" : /tasks/.test(path) ? "tasks" : /guide/.test(path) ? "guide" : "exam";
  var MAIN = [
    ["study", "📚 섹션별 학습", "study.html", "챕터 노트 · Cheat Sheet · 예상문제"],
    ["tasks", "🎯 Task별 학습", "tasks.html", "공식 Task 1.1–5.6 노트 · 함정 · 시나리오"],
    ["guide", "📘 가이드 학습", "guide.html", "이론 13단원 노트 · 시험 포인트 · 확인 문제"],
    ["exam", "📝 모의고사", "index.html", "60문항 실전 모의고사"]
  ];
  var SUB = {
    study: [["🏠 홈", "study.html#/"], ["❌ 오답 복습", "study.html#/review"]],
    tasks: [["🏠 홈", "tasks.html#/"], ["⚠️ 시험 함정 모음", "tasks.html#/traps"], ["❌ 오답 복습", "tasks.html#/review"]],
    guide: [["🏠 홈", "guide.html#/"], ["❌ 오답 복습", "guide.html#/review"]],
    exam: [["실전 1", "index.html?set=practice-1"], ["실전 2", "index.html?set=practice-2"], ["실전 3", "index.html?set=practice-3"],
           ["실전 4", "index.html"], ["실전형 시나리오 (6중 4 무작위)", "index.html?set=scenario-pool"]]
  };
  var css = "#gnav{position:" + (page === "exam" ? "relative" : "sticky") + ";top:0;z-index:50;background:var(--panel,#fff);border-bottom:1px solid var(--line,#e6e2db);font:14px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI','Malgun Gothic',sans-serif}" +
    "#gnav .in{max-width:1180px;margin:0 auto;padding:0 16px}" +
    "#gnav .main{display:flex;gap:4px;overflow-x:auto;scrollbar-width:none}" +
    "#gnav a{color:var(--ink,#1f1d1a);text-decoration:none;white-space:nowrap}" +
    "#gnav .main a{padding:11px 14px;font-weight:600;border-bottom:3px solid transparent}" +
    "#gnav .main a:hover{color:var(--accent,#c8613b)}" +
    "#gnav .main a.on{color:var(--accent,#c8613b);border-bottom-color:var(--accent,#c8613b)}" +
    "#gnav .sub{display:flex;gap:6px;flex-wrap:wrap;padding:6px 0 8px;border-top:1px solid var(--line,#e6e2db)}" +
    "#gnav .sub a{font-size:13px;padding:3px 10px;border-radius:99px;background:var(--panel-2,#f4f2ee);color:var(--ink-soft,#5b564e)}" +
    "#gnav .sub a:hover{color:var(--accent,#c8613b)}" +
    "#gnav.hide{display:none}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  var nav = document.createElement("nav"); nav.id = "gnav"; nav.setAttribute("aria-label", "주 메뉴");
  var h = '<div class="in"><div class="main">';
  MAIN.forEach(function (m) {
    h += '<a href="' + m[2] + '" title="' + m[3] + '"' + (m[0] === page ? ' class="on" aria-current="page"' : "") + ">" + m[1] + "</a>";
  });
  h += '</div><div class="sub">';
  SUB[page].forEach(function (s) { h += '<a href="' + s[1] + '">' + s[0] + "</a>"; });
  h += "</div></div>";
  nav.innerHTML = h;
  document.body.insertBefore(nav, document.body.firstChild);
  // 모의고사 진행 중(시험 화면)에는 메뉴를 숨겨 타이머 UI와 겹치지 않게 한다.
  if (page === "exam") {
    var sync = function () {
      var ex = document.getElementById("examScreen");
      nav.classList.toggle("hide", !!ex && !ex.classList.contains("hide"));
    };
    document.addEventListener("DOMContentLoaded", function () {
      var ex = document.getElementById("examScreen");
      if (ex) new MutationObserver(sync).observe(ex, { attributes: true, attributeFilter: ["class"] });
      sync();
    });
  }
})();
