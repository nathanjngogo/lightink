(async () => {
  const disk = await (await fetch('app://local/index.html?nocache=' + Date.now())).text();
  return { liveHasDef: disk.includes('async function renderShelfData'), diskLen: disk.length };
})()