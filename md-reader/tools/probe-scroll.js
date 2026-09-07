(async () => {
  const $ = (s) => document.querySelector(s);
  const out = {};
  // 打开一个长文档（PRD），复现滚动场景
  await window.__openPath('C:/Users/1/Documents/ChatGPT/软件开发/md-reader/PRD-MD阅读器.md');
  await new Promise(r => setTimeout(r, 2000));
  const pane = $('#editorPane');
  const max = pane.scrollHeight - pane.clientHeight;
  out.max = max;
  out.scrollBefore = pane.scrollTop;

  /* ---- 1. elementFromPoint 探测：编辑区中心、滚轮应命中的点被谁挡住 ---- */
  const cx = window.innerWidth * 0.6, cy = window.innerHeight * 0.5;
  const stack = document.elementsFromPoint(cx, cy).slice(0, 6).map(el =>
    el.id ? '#' + el.id : el.tagName + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').slice(0, 2).join('.') : '')
  );
  out.hitStackAtCenter = stack;

  /* ---- 2. 合成滚轮事件（同源信任事件，测试可滚动性） ---- */
  pane.dispatchEvent(new WheelEvent('wheel', { deltaY: 300, bubbles: true, cancelable: true, clientX: cx, clientY: cy }));
  await new Promise(r => setTimeout(r, 400));
  out.scrollAfterSyntheticWheel = pane.scrollTop;

  /* ---- 3. JS 直接滚动（验证 scrollHeight/overflow 本身正常） ---- */
  pane.scrollTop = max * 0.5;
  await new Promise(r => setTimeout(r, 200));
  out.scrollProgrammatic = pane.scrollTop;
  pane.scrollTop = 0;

  /* ---- 4. 找透明覆盖层：全屏扫描覆盖在 content 之上的 fixed/absolute 元素 ---- */
  const overlays = [];
  for (const el of document.body.children) {
    const cs = getComputedStyle(el);
    if (cs.position === 'fixed' || cs.position === 'absolute') {
      const r = el.getBoundingClientRect();
      const coversViewport = r.width >= window.innerWidth * 0.9 && r.height >= window.innerHeight * 0.6;
      const visible = cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0.05;
      if (coversViewport && visible) {
        overlays.push({
          id: el.id || el.className.toString().slice(0, 40),
          pointerEvents: cs.pointerEvents,
          opacity: cs.opacity,
          zIndex: cs.zIndex,
          rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
        });
      }
    }
  }
  out.overlayLayers = overlays;

  /* ---- 5. scroll 事件监听器数量（防抖保存是否异常挂载多次） ---- */
  out.scrollListenersHint = typeof getEventListeners === 'function' ? 'devtools-only' : 'n/a';

  out.errs = window.__errors;
  return out;
})()
