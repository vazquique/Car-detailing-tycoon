// Starts the game: render loop, FX, audio unlock, save on exit and offline rewards.
import { engine, bootInfo } from './store/gameStore';
import { useUi } from './store/uiStore';
import { startLoop } from './render/loop';
import { installFx } from './ui/fx';
import { exposeDebug } from './ui/debugApi';
import { listenInstallPrompt } from './ui/install';
import { S } from './game/data/strings';
import {
  resumeAudio,
  setSoundEnabled,
  setVibrationEnabled,
  suspendAudio,
  unlockAudio,
} from './audio/sfx';

export function boot(): void {
  const ui = useUi.getState();
  setSoundEnabled(ui.settings.sound);
  setVibrationEnabled(ui.settings.vibration);
  installFx();
  exposeDebug();
  listenInstallPrompt();

  engine.onOffline = (result) => useUi.getState().openModal({ kind: 'offline', result });
  if (bootInfo.offline) ui.openModal({ kind: 'offline', result: bootInfo.offline });
  if (bootInfo.corrupt)
    window.setTimeout(() => useUi.getState().toast(S.toasts.corruptSave, 'bad'), 600);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      engine.save();
      suspendAudio();
    } else {
      resumeAudio();
    }
  });
  window.addEventListener('pagehide', () => engine.save());
  window.addEventListener('pointerdown', () => unlockAudio(), { capture: true });
  startLoop();
}
