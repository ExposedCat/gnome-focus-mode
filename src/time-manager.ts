import Shell from 'gi://Shell';

import { Window } from './window.js';
import type { UIManager } from './ui-manager.js';

export class TimeManager {
  private display = (global as any).display; // FIXME:
  private listener: NodeJS.Timeout | null = null;
  private activeTimeInterval: NodeJS.Timeout | null = null;
  private lastFocusedWindow: Window | null = null;
  private windows: Window[] = [];
  private activeTime = 0;

  constructor(private uiManager: UIManager) {}

  startActiveTracker() {
    this.activeTimeInterval = setInterval(() => {
      if (this.lastFocusedWindow) {
        const time = ((this.lastFocusedWindow.time / 1000) | 0) + this.activeTime;
        this.uiManager.updateEntryText(this.lastFocusedWindow.id, `${this.lastFocusedWindow.name} - ${time}s`);
        this.uiManager.setText(`${time}s`);
      } else {
        this.uiManager.setText('Nice wallpaper');
      }
      this.activeTime += 1;
    }, 1000);
  }

  getOrCreateWindow(id: string) {
    let window = this.windows.find(window => window.id === id);
    if (window) {
      return window;
    }
    const app = Shell.WindowTracker.get_default().get_window_app(this.display.focus_window);
    window = new Window(id, app.get_name());
    this.windows.push(window);
    return window;
  }

  extractFocusedWindow() {
    const windowMeta = this.display.focus_window;
    if (windowMeta) {
      const app = Shell.WindowTracker.get_default().get_window_app(windowMeta);
      const id = app.get_id();
      const window = this.getOrCreateWindow(id);
      return { id, window };
    }
    return { id: null, window: null };
  }

  onFocusChanged() {
    log('[focus-mode][time] Focus changed');
    this.lastFocusedWindow?.close();
    const { id, window } = this.extractFocusedWindow();
    this.lastFocusedWindow = window;
    this.activeTime = 0;
    if (id && this.lastFocusedWindow) {
      this.lastFocusedWindow.open();
      this.uiManager.updateEntryText(id, `${window.time}`);
    }
  }

  start() {
    log('[focus-mode][time] Start watching');
    this.listener = this.display.connect('notify::focus-window', () => this.onFocusChanged());
    this.onFocusChanged();
    this.startActiveTracker();
  }

  stop() {
    log('[focus-mode][time] Stop watching');
    if (this.activeTimeInterval) {
      clearInterval(this.activeTimeInterval);
      this.activeTimeInterval = null;
    }
    this.lastFocusedWindow?.close();
    this.display.disconnect(this.listener);
    this.listener = null;
  }

  getStats() {
    const stats = this.windows.map(window => `${window.name} - ${window.time / 1000}s`).join('\n');
    return `[focus-mode][time] CURRENT TIME STATS:\n\n${stats}`;
  }
}
