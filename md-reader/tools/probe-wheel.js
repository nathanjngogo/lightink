(() => {
  // 合成滚轮在合成事件路径下可能不触发默认滚动（Chromium 对 isTrusted=false 的 wheel 不滚动）。
  // 换 CDP Input.dispatchMouseEvent 级别的真实输入不可用，改用两段验证：
  // A. scroll 事件响应性（scrollIntoView 触发链）
  // B. 用 wheel 的 defaultPrevented 检查有没有人 preventDefault（拦截源检测）
  const pane = document.querySelector('#editorPane');
  const cx = Math.round(window.innerWidth * 0.6), cy = Math.round(window.innerHeight * 0.5);
  let prevented = null, bubbledTo = [];
  const onWinWheel = (e) => bubbledTo.push(e.target.id || e.target.tagName);
  window.addEventListener('wheel', onWinWheel, { capture: false, passive: true, once: true });
  const ev = new WheelEvent('wheel', { deltaY: 400, bubbles: true, cancelable: true, clientX: cx, clientY: cy });
  // dispatch 到命中元素而非 pane（模拟真实命中路径）
  const hit = document.elementFromPoint(cx, cy);
  hit.dispatchEvent(ev);
  prevented = ev.defaultPrevented;
  return {
    hitTag: hit.tagName + (hit.id ? '#' + hit.id : ''),
    wheelDefaultPrevented: prevented,
    bubbledTo,
    paneOverflowY: getComputedStyle(pane).overflowY,
    paneScrollHeight: pane.scrollHeight,
    paneClientHeight: pane.clientHeight,
  };
})()
