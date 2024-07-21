import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import St from 'gi://St';
import Clutter from 'gi://Clutter';

export class UIManager {
  private entries: Record<string, PopupMenu.PopupMenuItem> = {};
  private button: PanelMenu.Button;
  private label: St.Label;
  private clipboard = St.Clipboard.get_default();

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
      this.entries[id].connect('activate', () => {
        log(`Copying ${id} to the clipboard`);
        this.clipboard.set_text(St.ClipboardType.CLIPBOARD, id);
        Main.notify(`Focus Mode`, `Copied "${id}"`);
      });
      (this.button.menu as PopupMenu.PopupMenu).addMenuItem(this.entries[id]);
    }
  }

  setState(state: 'normal' | 'warning' | 'error') {
    const background = state === 'normal' ? 'unset' : state === 'warning' ? 'orange' : 'red';
    const color = state === 'normal' ? 'unset' : 'white';
    this.button.set_style(`background-color: ${background}; color: ${color};`);
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
