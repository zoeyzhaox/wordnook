export function runtimeLabel(runtime) {
  if (!runtime) return '浏览器预览版（学习记录保存在此浏览器）';
  const systems = {darwin: 'macOS', win32: 'Windows', linux: 'Linux'};
  const system = systems[runtime.platform] || runtime.platform;
  const macChips = {arm64: 'Apple 芯片版', x64: 'Intel 版'};
  const edition = runtime.platform === 'darwin' ? macChips[runtime.arch] : null;
  return `${system} 桌面版 · ${edition ? `${edition}（${runtime.arch}）` : runtime.arch}`;
}
