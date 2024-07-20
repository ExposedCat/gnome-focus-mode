import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import St from 'gi://St';
import Shell from 'gi://Shell';
import Clutter from 'gi://Clutter';

class Window {
  time = 0;
  private openedAt: number | null = null;

  constructor(
    public id: string,
    public name: string,
  ) {
    log(`[focus-mode][window] Window "${this.name}" created`);
  }

  open() {
    log(`[focus-mode][window] Window "${this.name}" opened`);
    this.openedAt = Date.now();
  }

  close() {
    const elapsed = Date.now() - this.openedAt!;
    this.openedAt = null;
    this.time += elapsed;
    log(`[focus-mode][window] Window "${this.name}" closed with diff ${elapsed}, total of ${this.time}`);
  }
}

class TimeManager {
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

class UIManager {
  private entries: Record<string, PopupMenu.PopupMenuItem> = {};
  private button: PanelMenu.Button;
  private label: St.Label;

  constructor() {
    this.button = new PanelMenu.Button(0.0, '', false);

    const box = new St.BoxLayout();

    const icon = new St.Icon({ icon_name: 'preferences-system-time-symbolic', style_class: 'system-status-icon' });
    box.add_child(icon);

    this.label = new St.Label({ text: 'Nice wallpaper', y_align: Clutter.ActorAlign.CENTER });
    box.add_child(this.label);

    this.button.add_child(box);
  }

  setText(text: string) {
    this.label.set_text(text);
  }

  updateEntryText(id: string, text: string) {
    const entry = this.entries[id];
    if (entry) {
      entry.label.set_text(text);
    } else {
      this.entries[id] = new PopupMenu.PopupMenuItem(text);
      (this.button.menu as any).addMenuItem(this.entries[id]);
    }
  }

  start() {
    log('[focus-mode][ui] Enable manager');
    Main.panel.addToStatusArea('screen-time-button', this.button, 1, 'left');
  }

  stop() {
    log('[focus-mode][ui] Disable manager');
    this.button.destroy();
  }
}

export default class TimeTrackerExtension extends Extension {
  private timeManager: TimeManager | null = null;
  private uiManager: UIManager | null = null;

  enable() {
    log('[focus-mode][main] Enable extension');
    if (this.uiManager === null) {
      this.uiManager = new UIManager();
    }
    if (this.timeManager === null) {
      this.timeManager = new TimeManager(this.uiManager);
    }
    this.uiManager.start();
    this.timeManager.start();
  }

  disable() {
    log('[focus-mode][main] Disable extension');
    this.uiManager!.stop();
    this.timeManager!.stop();
    this.timeManager = null;
  }
}
