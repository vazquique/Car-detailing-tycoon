import { Settings, Volume2, VolumeX } from 'lucide-react';
import { useG } from '../../store/gameStore';
import { useUi } from '../../store/uiStore';
import { S } from '../../game/data/strings';
import { formatClock, formatMoney } from '../../game/format';
import { calendarOf } from '../../game/sim/calendar';
import { incomePerMinute } from '../../store/selectors';
import { Stars } from '../components/Stars';
import { MoneyCounter } from './MoneyCounter';
import { WeatherIcon } from './WeatherIcon';
import { EventBanner } from './EventBanner';
import { setSoundEnabled, unlockAudio } from '../../audio/sfx';

export function Hud() {
  const rep = useG((s) => s.reputation);
  const day = useG((s) => s.day);
  const minute = useG((s) => s.minute);
  const weather = useG((s) => s.weather);
  const perMin = useG(incomePerMinute);
  const location = useG((s) => s.location);
  const sound = useUi((u) => u.settings.sound);
  const setSetting = useUi((u) => u.setSetting);
  const openModal = useUi((u) => u.openModal);
  const cal = calendarOf(day);
  const weekday = S.weekdays[cal.weekday] ?? '';
  return (
    <header
      className="relative z-20 shrink-0 border-b border-line/70 bg-gradient-to-b from-bg-1 to-bg-0 px-3 pb-2"
      style={{ paddingTop: 'calc(var(--safe-top) + 8px)' }}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1" data-tutorial="money">
          <MoneyCounter />
          <div className="tabular mt-1 text-[14px] font-medium text-dim">
            <span className={perMin >= 0 ? 'text-gain' : 'text-loss'}>
              {perMin >= 0 ? '+' : ''}
              {S.hud.perMinute(formatMoney(perMin))}
            </span>
            <span className="mx-1.5 text-line">|</span>
            <span>{S.locations[location]?.short}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center">
          <button
            type="button"
            aria-label={sound ? S.hud.mute : S.hud.unmute}
            onClick={() => {
              unlockAudio();
              setSoundEnabled(!sound);
              setSetting('sound', !sound);
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full text-dim active:bg-surface-1"
          >
            {sound ? <Volume2 size={22} /> : <VolumeX size={22} />}
          </button>
          <button
            type="button"
            aria-label={S.hud.settings}
            onClick={() => openModal({ kind: 'settings' })}
            className="flex h-11 w-11 items-center justify-center rounded-full text-dim active:bg-surface-1"
          >
            <Settings size={22} />
          </button>
        </div>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-full border border-line bg-surface-0 px-2.5 py-1">
          <Stars value={rep} size={15} />
          <span className="tabular text-[14px] font-bold text-star">{rep.toFixed(1)}</span>
        </div>
        <button
          type="button"
          onClick={() => openModal({ kind: 'forecast' })}
          className="flex min-h-9 min-w-0 flex-1 items-center justify-end gap-1.5 rounded-full border border-line bg-surface-0 px-2.5 py-1 text-[14px] font-medium text-ink"
        >
          <WeatherIcon id={weather} />
          <span className="tabular truncate">
            {S.hud.day(day, weekday, formatClock(Math.min(minute, 20 * 60)))}
          </span>
        </button>
      </div>
      <EventBanner />
    </header>
  );
}
