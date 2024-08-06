import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

import { UIManager } from './ui-manager.js';
import { TimeManager } from './time-manager.js';

export default class TimeTrackerExtension extends Extension {
  private timeManager: TimeManager | null = null;
  private uiManager: UIManager | null = null;

  enable() {
    if (this.uiManager === null) {
      this.uiManager = new UIManager();
    }
    if (this.timeManager === null) {
      const settings = this.getSettings();
      this.timeManager = new TimeManager(this.uiManager, settings);
    }
    this.uiManager.start();
    this.timeManager.start();
  }

  disable() {
    this.timeManager!.stop();
    this.timeManager = null;
    this.uiManager!.stop();
    this.uiManager = null;
  }
}
