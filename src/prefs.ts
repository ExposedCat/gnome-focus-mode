import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import Adw from 'gi://Adw';

export type SettingsWindow = Adw.PreferencesWindow & {
  _settings: Gio.Settings;
};

export type BuildNumberRowArgs = {
  settings: Gio.Settings;
  row: Adw.SpinRow;
  key: string;
  maxRow?: Adw.SpinRow | null;
  maxKey?: string;
  range?: [number, number, number];
};

export default class PreferencesManager extends ExtensionPreferences {
  fillPreferencesWindow(window: SettingsWindow) {
    // TODO: Use shared class context
    window._settings = this.getSettings();

    // const windowsPage = new Adw.PreferencesPage({
    //   title: 'Windows',
    //   icon_name: 'overlapping-windows-symbolic',
    // });
    // window.add(windowsPage);

    // const windowsGroup = new Adw.PreferencesGroup({});
    // windowsPage.add(windowsGroup);

    // const windowsRow = new Adw.EntryRow({
    //   title: 'Work windows (comma-separated IDs)',
    // });
    // this.bindStringRow(window._settings, windowsRow, 'work-windows');
    // windowsGroup.add(windowsRow);

    const timePage = new Adw.PreferencesPage({
      title: 'Time',
      icon_name: 'camera-timer-symbolic',
    });
    window.add(timePage);

    const timeGroup = new Adw.PreferencesGroup({});
    timePage.add(timeGroup);

    const warningTimeRow = new Adw.SpinRow({
      title: 'Warning time',
      subtitle: 'Time of usage in seconds to show warning',
    });
    this.bindNumberRow({
      settings: window._settings,
      row: warningTimeRow,
      key: 'warning-time',
      range: [1, 30 * 60 * 1000, 1],
    });
    timeGroup.add(warningTimeRow);

    const errorTimeRow = new Adw.SpinRow({
      title: 'Error time',
      subtitle: 'Time of usage in seconds to show error',
    });
    this.bindNumberRow({
      settings: window._settings,
      row: errorTimeRow,
      key: 'error-time',
      range: [1, 30 * 60 * 1000, 1],
    });
    timeGroup.add(errorTimeRow);
  }

  bindStringRow(settings: Gio.Settings, row: Adw.EntryRow, key: string) {
    settings.bind(key, row, 'text', Gio.SettingsBindFlags.DEFAULT);
  }

  bindNumberRow(args: BuildNumberRowArgs) {
    const { row, range = [0, 500, 1], settings, key, maxKey, maxRow } = args;
    row.adjustment = new Gtk.Adjustment({
      lower: range[0],
      upper: range[1],
      step_increment: range[2],
    });
    row.value = settings.get_int(key);
    row.connect('notify::value', spin => {
      const newValue = spin.get_value();
      settings.set_int(key, newValue);
      if (maxKey) {
        const maxValue = settings.get_int(maxKey);
        if (maxValue < newValue) {
          settings.set_int(maxKey, newValue);
          if (maxRow) {
            maxRow.value = newValue;
          }
        }
      }
    });
  }
}
