import Shell from 'gi://Shell';
import Clutter from 'gi://Clutter';

export type WindowActor = {
  add_effect: (effect: Clutter.OffscreenEffect) => void;
  remove_effect: (effect: Clutter.OffscreenEffect) => void;
  get_effects: () => Clutter.OffscreenEffect[];
};

export type Effect = 'blur';

export class EffectManager {
  private affectedApps = new Set<string>();

  private getAppActors = (id: string) => {
    const app = Shell.AppSystem.get_default().lookup_app(id);
    if (!app) {
      return [];
    }
    const windows = app.get_windows();
    return windows.map(window => window.get_compositor_private<WindowActor>());
  };

  private createEffect(effect: Effect) {
    return {
      'blur': new Clutter.BlurEffect(),
    }[effect];
  }

  applyEffect(id: string, effect: Effect) {
    this.removeEffects(id);
    this.affectedApps.add(id);
    const effectObject = this.createEffect(effect);
    const windows = this.getAppActors(id);
    for (const window of windows) {
      window.add_effect(effectObject);
    }
  }

  removeEffects(id: string) {
    const actors = this.getAppActors(id);
    for (const actor of actors) {
      const effects = actor.get_effects();
      for (const effect of effects) {
        actor.remove_effect(effect);
      }
    }
    this.affectedApps.delete(id);
  }

  dispose() {
    for (const app of this.affectedApps) {
      this.removeEffects(app);
    }
    this.affectedApps = null!;
  }
}
