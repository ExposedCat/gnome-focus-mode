import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

import { UIManager } from './ui-manager.js';
import { TimeManager } from './time-manager.js';

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
