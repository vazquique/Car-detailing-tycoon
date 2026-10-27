// PWA install helpers: Android prompt and iPhone instructions.

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: BeforeInstallPromptEvent | null = null;

export function listenInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
  });
}

function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia?.('(display-mode: fullscreen)').matches ||
    window.matchMedia?.('(display-mode: standalone)').matches ||
    nav.standalone === true
  );
}

function isIos(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document);
}

export type InstallState = 'installed' | 'prompt' | 'ios' | 'other';

export function installState(): InstallState {
  if (isStandalone()) return 'installed';
  if (deferred) return 'prompt';
  if (isIos()) return 'ios';
  return 'other';
}

export async function promptInstall(): Promise<void> {
  if (!deferred) return;
  await deferred.prompt();
  await deferred.userChoice;
  deferred = null;
}
