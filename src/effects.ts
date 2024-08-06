import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import Clutter from 'gi://Clutter';

export const blur = () => new Clutter.BlurEffect();

export const applyEffect = (effect: Clutter.OffscreenEffect) => Main.uiGroup.add_effect(effect);

export const removeEffect = (effect: Clutter.OffscreenEffect) => Main.uiGroup.remove_effect(effect);
