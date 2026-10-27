import { useEffect } from 'react';
import { useUi } from './store/uiStore';
import { Hud } from './ui/hud/Hud';
import { Workshop } from './ui/workshop/Workshop';
import { TabBar } from './ui/TabBar';
import { TabSheets } from './ui/TabSheets';
import { NightOverlay } from './ui/modals/NightOverlay';
import { ScrubOverlay } from './ui/modals/ScrubOverlay';
import { ModalHost } from './ui/modals/ModalHost';
import { Celebrations } from './ui/modals/Celebration';
import { MovingOverlay } from './ui/modals/MovingOverlay';
import { OverlayCanvas } from './ui/OverlayCanvas';
import { Toasts } from './ui/components/Toast';
import { DebugPanel } from './ui/Debug';
import { RotateNotice } from './ui/RotateNotice';
import { setRootAnchor } from './ui/hud/anchors';
import { setReducedParticles } from './render/particles';

export function App() {
  const reduced = useUi((u) => u.settings.reducedMotion);
  useEffect(() => {
    document.documentElement.classList.toggle('reduced-motion', reduced);
    setReducedParticles(reduced);
  }, [reduced]);
  return (
    <div className="flex h-full w-full justify-center bg-[#05070C]">
      <div
        id="game"
        ref={setRootAnchor}
        className="relative flex h-full w-full max-w-[480px] flex-col overflow-hidden bg-bg-0 shadow-[0_0_80px_rgba(34,211,238,0.06)]"
      >
        <Hud />
        <Workshop />
        <TabBar />
        <TabSheets />
        <NightOverlay />
        <ScrubOverlay />
        <ModalHost />
        <Celebrations />
        <MovingOverlay />
        <OverlayCanvas />
        <Toasts />
        <DebugPanel />
        <RotateNotice />
      </div>
    </div>
  );
}
