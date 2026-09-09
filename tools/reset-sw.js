(async () => {
  // 固定到关态截图
  localStorage.setItem('mdr:keepMode','0');
  location.reload();
  return 'reloading';
})()