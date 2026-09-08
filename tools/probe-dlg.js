(async () => {
  const $ = s => document.querySelector(s);
  document.querySelector('#btnNewDoc').click();
  await new Promise(r=>setTimeout(r,250));
  document.querySelector('#dlgInput').value = 'probe-g.md';
  document.querySelector('#dlgOk').click();
  await new Promise(r=>setTimeout(r,1200));
  document.querySelector('#btnCloseDoc').click();
  const states = [];
  for (let i=0;i<6;i++) {
    await new Promise(r=>setTimeout(r,150));
    states.push({t:(i+1)*150, dlg: document.querySelector('#dlg').classList.contains('show'),
                 discardBtn: !!document.querySelector('#dlgDiscard')});
  }
  return states;
})()