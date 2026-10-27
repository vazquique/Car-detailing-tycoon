import { useState } from 'react';
import { Copy, Download, Heart, RotateCcw, Smartphone, Upload, X } from 'lucide-react';
import { engine } from '../../store/gameStore';
import { useUi, type Settings } from '../../store/uiStore';
import { S } from '../../game/data/strings';
import { exportSave, importSave, clearSave } from '../../game/save/save';
import { createInitialState } from '../../game/sim/newGame';
import { Modal } from '../components/Sheet';
import { Button } from '../components/Button';
import { setSoundEnabled, setVibrationEnabled } from '../../audio/sfx';
import { setReducedParticles } from '../../render/particles';
import { installState, promptInstall } from '../install';

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="flex min-h-12 w-full items-center justify-between gap-3 border-b border-line/60 py-1 text-left text-[15px] font-medium text-ink last:border-0"
    >
      <span>{label}</span>
      <span
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${value ? 'bg-water' : 'bg-line'}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-[left] ${value ? 'left-6' : 'left-1'}`}
        />
        <span className="sr-only">{value ? 'Sí' : 'No'}</span>
      </span>
    </button>
  );
}

type View = 'main' | 'export' | 'import' | 'reset' | 'reset2' | 'credits' | 'install';

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const settings = useUi((u) => u.settings);
  const setSetting = useUi((u) => u.setSetting);
  const toast = useUi((u) => u.toast);
  const [view, setView] = useState<View>('main');
  const [code, setCode] = useState('');
  const [importText, setImportText] = useState('');

  const set = <K extends keyof Settings>(k: K, v: Settings[K]): void => {
    setSetting(k, v);
    if (k === 'sound') setSoundEnabled(v as boolean);
    if (k === 'vibration') setVibrationEnabled(v as boolean);
    if (k === 'reducedMotion') {
      setReducedParticles(v as boolean);
      document.documentElement.classList.toggle('reduced-motion', v as boolean);
    }
  };

  const header = (title: string) => (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="font-display text-[21px] text-ink">{title}</h2>
      <button
        type="button"
        aria-label={S.buttons.close}
        onClick={onClose}
        className="-mr-2 flex h-11 w-11 items-center justify-center text-dim"
      >
        <X size={22} />
      </button>
    </div>
  );

  if (view === 'export') {
    return (
      <Modal label={S.settings.exportSave} onClose={onClose}>
        {header(S.settings.exportSave)}
        <p className="text-[14px] text-dim">{S.settings.exportHint}</p>
        <textarea
          readOnly
          value={code}
          className="mt-2 h-32 w-full rounded-xl border border-line bg-bg-0 p-2 font-mono text-[14px] break-all text-ink"
          onFocus={(e) => e.currentTarget.select()}
        />
        <Button
          className="mt-2 w-full"
          onClick={() => {
            void navigator.clipboard?.writeText(code).then(
              () => toast(S.toasts.copied, 'good'),
              () => undefined,
            );
          }}
        >
          <Copy size={18} /> {S.settings.copy}
        </Button>
        <Button variant="secondary" className="mt-2 w-full" onClick={() => setView('main')}>
          {S.buttons.back}
        </Button>
      </Modal>
    );
  }
  if (view === 'import') {
    return (
      <Modal label={S.settings.importSave} onClose={onClose}>
        {header(S.settings.importSave)}
        <p className="text-[14px] text-dim">{S.settings.importHint}</p>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          className="mt-2 h-32 w-full rounded-xl border border-line bg-bg-0 p-2 font-mono text-[14px] text-ink"
        />
        <Button
          className="mt-2 w-full"
          onClick={() => {
            const st = importSave(importText);
            if (!st) {
              toast(S.toasts.importError, 'bad');
              return;
            }
            st.savedAt = Date.now();
            engine.replace(st);
            engine.save();
            toast(S.toasts.imported, 'good');
            onClose();
          }}
        >
          <Upload size={18} /> {S.settings.importDo}
        </Button>
        <Button variant="secondary" className="mt-2 w-full" onClick={() => setView('main')}>
          {S.buttons.back}
        </Button>
      </Modal>
    );
  }
  if (view === 'reset' || view === 'reset2') {
    return (
      <Modal label={S.settings.reset} onClose={onClose}>
        {header(S.settings.reset)}
        <p className="text-[15px] text-ink">
          {view === 'reset' ? S.settings.resetConfirm1 : S.settings.resetConfirm2}
        </p>
        <div className="mt-3 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setView('main')}>
            {S.staff.cancel}
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => {
              if (view === 'reset') {
                setView('reset2');
                return;
              }
              clearSave();
              engine.replace(
                createInitialState((Date.now() ^ Math.floor(Math.random() * 1e9)) | 0),
              );
              engine.save();
              setSetting('tutorialDone', false);
              onClose();
            }}
          >
            {view === 'reset' ? S.settings.reset : S.settings.resetYes}
          </Button>
        </div>
      </Modal>
    );
  }
  if (view === 'credits') {
    return (
      <Modal label={S.settings.credits} onClose={onClose}>
        {header(S.settings.credits)}
        <div className="flex flex-col gap-1.5">
          {S.settings.creditsText.map((t, i) => (
            <p
              key={t}
              className={
                i === 0 ? 'font-display text-[18px] text-water' : 'text-[15px] text-ink/90'
              }
            >
              {t}
            </p>
          ))}
        </div>
        <Heart size={20} className="mx-auto mt-3 text-soap" fill="currentColor" />
        <Button variant="secondary" className="mt-3 w-full" onClick={() => setView('main')}>
          {S.buttons.back}
        </Button>
      </Modal>
    );
  }
  if (view === 'install') {
    const st = installState();
    return (
      <Modal label={S.settings.install} onClose={onClose}>
        {header(st === 'ios' ? S.settings.installIosTitle : S.settings.install)}
        {st === 'installed' && <p className="text-[15px] text-gain">{S.settings.installed}</p>}
        {st === 'ios' && (
          <ol className="flex list-decimal flex-col gap-2 pl-5 text-[15px] text-ink">
            {S.settings.installIos.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
        )}
        {st === 'other' && <p className="text-[15px] text-ink">{S.settings.installOther}</p>}
        <Button variant="secondary" className="mt-3 w-full" onClick={() => setView('main')}>
          {S.buttons.back}
        </Button>
      </Modal>
    );
  }
  return (
    <Modal label={S.settings.title} onClose={onClose}>
      {header(S.settings.title)}
      <div className="rounded-2xl border border-line bg-surface-0 px-3">
        <Toggle label={S.settings.sound} value={settings.sound} onChange={(v) => set('sound', v)} />
        <Toggle
          label={S.settings.vibration}
          value={settings.vibration}
          onChange={(v) => set('vibration', v)}
        />
        <Toggle
          label={S.settings.daySummary}
          value={settings.daySummary}
          onChange={(v) => set('daySummary', v)}
        />
        <Toggle
          label={S.settings.reducedMotion}
          value={settings.reducedMotion}
          onChange={(v) => set('reducedMotion', v)}
        />
      </div>
      <Button
        className="mt-3 w-full"
        onClick={() => {
          const st = installState();
          if (st === 'prompt') void promptInstall();
          else setView('install');
        }}
      >
        <Smartphone size={18} /> {S.settings.install}
      </Button>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          small
          onClick={() => {
            setCode(exportSave(engine.state));
            setView('export');
          }}
        >
          <Download size={17} /> {S.settings.exportSave}
        </Button>
        <Button variant="secondary" small onClick={() => setView('import')}>
          <Upload size={17} /> {S.settings.importSave}
        </Button>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          small
          onClick={() => {
            setSetting('tutorialDone', false);
            onClose();
          }}
        >
          {S.settings.tutorialReplay}
        </Button>
        <Button variant="secondary" small onClick={() => setView('credits')}>
          {S.settings.credits}
        </Button>
      </div>
      <Button variant="ghost" className="mt-2 w-full text-loss" onClick={() => setView('reset')}>
        <RotateCcw size={17} /> {S.settings.reset}
      </Button>
    </Modal>
  );
}
