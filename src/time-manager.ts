import Shell from 'gi://Shell';
import Gio from 'gi://Gio';

import { Window } from './window.js';
import { formatTime } from './utils.js';
import type { UIManager } from './ui-manager.js';

export class TimeManager {
  private display = (global as unknown as Shell.Global).display;
  private listener: number | null = null;
  private activeTimeInterval: NodeJS.Timeout | null = null;
  private lastFocusedWindow: Window | null = null;
  private windows: Window[] = [];
  private activeTime = 0;

  constructor(
    private uiManager: UIManager,
    private settings: Gio.Settings,
  ) {}

  startActiveTracker() {
    this.activeTimeInterval = setInterval(() => {
      if (this.lastFocusedWindow) {
        const time = ((this.lastFocusedWindow.time / 1000) | 0) + this.activeTime;
        const stringTime = formatTime(time);
        this.uiManager.updateEntryText(this.lastFocusedWindow.id, this.lastFocusedWindow.name, stringTime);
        this.uiManager.setText(stringTime);
      } else {
        this.uiManager.setText('Nice wallpaper');
      }
      this.activeTime += 1;
      if (this.lastFocusedWindow) {
        if (this.activeTime >= this.settings.get_int('error-time')) {
          this.uiManager.setState(this.lastFocusedWindow.id, 'error');
        } else if (this.activeTime > this.settings.get_int('warning-time')) {
          this.uiManager.setState(this.lastFocusedWindow.id, 'warning');
        } else {
          this.uiManager.setState(this.lastFocusedWindow.id, 'normal');
        }
      }
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
    this.activeTime = 0;
    this.uiManager.setState(null, 'normal');
    this.lastFocusedWindow?.close();
    const { window } = this.extractFocusedWindow();
    this.lastFocusedWindow = window;
    this.lastFocusedWindow?.open();
  }

  start() {
    this.listener = this.display.connect('notify::focus-window', () => this.onFocusChanged());
    this.onFocusChanged();
    this.startActiveTracker();
  }

  stop() {
    if (this.activeTimeInterval) {
      clearInterval(this.activeTimeInterval);
      this.activeTimeInterval = null;
    }
    this.lastFocusedWindow?.close();
    if (this.listener) {
      this.display.disconnect(this.listener);
    }
    this.listener = null;
  }
}
