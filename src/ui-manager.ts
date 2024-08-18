import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import St from 'gi://St';
import Gda5 from 'gi://Gda?version=5.0';
import Clutter from 'gi://Clutter';

import { EffectManager } from './effect-manager.js';
import { connectToDb, createApp, getEnabledApps, setAppEnabled } from './database.js';

export class UIManager {
  private entries: Record<string, PopupMenu.PopupMenuItem> = {};
  private button: PanelMenu.Button;
  private label: St.Label;
  private db: Gda5.Connection;
  private enabledApps: Record<string, boolean> = {};
  private effectManager: EffectManager;

  constructor() {
    this.db = connectToDb();

    this.fetchEnabledApps();

    this.button = new PanelMenu.Button(0.0, '', false);

    const box = new St.BoxLayout();

    const icon = new St.Icon({ icon_name: 'preferences-system-time-symbolic', style_class: 'system-status-icon' });
    box.add_child(icon);

    this.label = new St.Label({ text: 'Nice wallpaper', y_align: Clutter.ActorAlign.CENTER });
    box.add_child(this.label);

    this.button.add_child(box);

    this.effectManager = new EffectManager();
  }

  fetchEnabledApps() {
    const enabledIds = getEnabledApps(this.db);
    this.enabledApps = Object.fromEntries(enabledIds.map(({ id, enabled }) => [id, enabled]));
  }

  setText(text: string) {
    this.label.set_text(text);
  }

  updateEntryText(id: string, name: string, time: string) {
    const entry = this.entries[id];
    const enabled = !!this.enabledApps[id];
    const text = `${enabled ? '+' : ''} ${name} - ${time}`;
    if (entry) {
      entry.label.set_text(text);
    } else {
      this.entries[id] = new PopupMenu.PopupMenuItem(text);
      this.entries[id].connect('activate', () => {
        if (id in this.enabledApps) {
          const enabled = !this.enabledApps[id];
          setAppEnabled(this.db, id, enabled);
          this.enabledApps[id] = enabled;
          if (!enabled) {
            this.setState(id, 'normal');
          }
        } else {
          this.enabledApps[id] = true;
          createApp(this.db, id, true);
        }
        const enabled = this.enabledApps[id];
        const currentText = this.entries[id].label.get_text();
        this.entries[id].label.set_text(`${enabled ? '+' : ''} ${currentText.slice(enabled ? 2 : 1)}`);
      });
      (this.button.menu as PopupMenu.PopupMenu).addMenuItem(this.entries[id]);
    }
  }

  setState(id: string | null, state: 'normal' | 'warning' | 'error') {
    if (!id || this.enabledApps[id] || state === 'normal') {
      if (id) {
        if (state === 'error') {
          this.effectManager.applyEffect(id, 'blur');
        } else if (state === 'normal') {
          this.effectManager.removeEffects(id);
        }
      }
      const background = state === 'normal' ? 'unset' : state === 'warning' ? 'orange' : 'red';
      const color = state === 'normal' ? 'unset' : 'white';
      this.button.set_style(`background-color: ${background}; color: ${color};`);
    }
  }

  start() {
    Main.panel.addToStatusArea('screen-time-button', this.button, 1, 'left');
  }

  stop() {
    this.db.close();
    this.effectManager.dispose();
    this.button.destroy();
  }
}
