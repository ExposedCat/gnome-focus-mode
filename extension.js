import Shell from 'gi://Shell';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

class Window {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.time = 0;
    this.openedAt = null;
    log(`[time-tracker] Window "${this.name}" created`);
  }

  open() {
    log(`[time-tracker] Window "${this.name}" opened`);
    this.openedAt = Date.now();
  }

  close() {
    const elapsed = Date.now() - this.openedAt;
    this.openedAt = null;
    this.time += elapsed;
    log(`[time-tracker] Window "${this.name}" closed with diff ${elapsed}, total of ${this.time}`);
  }
}

class Manager {
  constructor() {
    this.display = global.display;
    this.listener = null;
    this.lastFocusedWindow = null;
    this.windows = [];
  }

  getFocusedWindow() {
    const windowMeta = this.display.focus_window;
    if (windowMeta) {
      const app = Shell.WindowTracker.get_default().get_window_app(windowMeta);
      const id = app.get_id();
      let window = this.windows.find(window => window.id === id);
      if (window) {
        return window;
      }
      window = new Window(id, app.get_name());
      this.windows.push(window);
      return window;
    }
    return null;
  }

  onFocusChanged() {
    log('[time-tracker] Focus changed');
    this.lastFocusedWindow?.close();
    this.lastFocusedWindow = this.getFocusedWindow();
    this.lastFocusedWindow?.open();
    log(this.getStats());
  }

  start() {
    log('[time-tracker] Start watching');
    this.listener = this.display.connect('notify::focus-window', () => this.onFocusChanged());
  }

  stop() {
    log('[time-tracker] Stop watching');
    this.lastFocusedWindow?.close();
    this.display.disconnect(this.listener);
    this.listener = null;
  }

  getStats() {
    const stats = this.windows.map(window => `${window.name} - ${window.time / 1_000}s`).join('\n');
    return `[time-tracker] CURRENT TIME STATS:\n\n${stats}`;
  }
}

export default class TimeTrackerExtension extends Extension {
  manager = null;

  enable() {
    log('[time-tracker] Enable extension');
    if (this.manager === null) {
      this.manager = new Manager();
    }
    this.manager.start();
  }

  disable() {
    log('[time-tracker] Disable extension');
    this.manager.stop();
    this.manager = null;
  }
}
