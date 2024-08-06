import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import St from 'gi://St';
import Gda5 from 'gi://Gda?version=5.0';
import Clutter from 'gi://Clutter';

import { applyEffect, blur, removeEffect } from './effects.js';
import { connectToDb, createWindow, getEnabledWindows, setWindowEnabled } from './database.js';

export class UIManager {
  private entries: Record<string, PopupMenu.PopupMenuItem> = {};
  private button: PanelMenu.Button;
  private label: St.Label;
  private db: Gda5.Connection;
  private enabledWindows: Record<string, boolean> = {};
  private effect: Clutter.OffscreenEffect | null = null;

  constructor() {
    this.db = connectToDb();

    this.fetchEnabledWindows();

    this.button = new PanelMenu.Button(0.0, '', false);

    const box = new St.BoxLayout();

    const icon = new St.Icon({ icon_name: 'preferences-system-time-symbolic', style_class: 'system-status-icon' });
    box.add_child(icon);

    this.label = new St.Label({ text: 'Nice wallpaper', y_align: Clutter.ActorAlign.CENTER });
    box.add_child(this.label);

    this.button.add_child(box);
  }

  fetchEnabledWindows() {
    const enabledIds = getEnabledWindows(this.db);
    this.enabledWindows = Object.fromEntries(enabledIds.map(({ id, enabled }) => [id, enabled]));
  }

  setText(text: string) {
    this.label.set_text(text);
  }

  updateEntryText(id: string, name: string, time: string) {
    const entry = this.entries[id];
    const enabled = !!this.enabledWindows[id];
    const text = `${enabled ? '+' : ''} ${name} - ${time}`;
    if (entry) {
      entry.label.set_text(text);
    } else {
      this.entries[id] = new PopupMenu.PopupMenuItem(text);
      this.entries[id].connect('activate', () => {
        if (id in this.enabledWindows) {
          const enabled = !this.enabledWindows[id];
          setWindowEnabled(this.db, id, enabled);
          this.enabledWindows[id] = enabled;
          if (!enabled) {
            this.setState(id, 'normal');
          }
        } else {
          this.enabledWindows[id] = true;
          createWindow(this.db, id, true);
        }
        const enabled = this.enabledWindows[id];
        const currentText = this.entries[id].label.get_text();
        this.entries[id].label.set_text(`${enabled ? '+' : ''} ${currentText.slice(enabled ? 2 : 1)}`);
      });
      (this.button.menu as PopupMenu.PopupMenu).addMenuItem(this.entries[id]);
    }
  }

  disableEffect() {
    if (this.effect) {
      removeEffect(this.effect);
      this.effect = null;
    }
  }

  enableEffect() {
    this.disableEffect();
    this.effect = blur();
    applyEffect(this.effect);
  }

  setState(id: string | null, state: 'normal' | 'warning' | 'error') {
    if (!id || this.enabledWindows[id] || state === 'normal') {
      if (state === 'error') {
        this.enableEffect();
      } else if (state === 'normal' && this.effect) {
        this.disableEffect();
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
    this.disableEffect();
    this.button.destroy();
  }
}
