import { Cloud, CloudRain, Sun, Tornado } from 'lucide-react';
import type { WeatherId } from '../../game/types';

export function WeatherIcon({ id, size = 18 }: { id: WeatherId; size?: number }) {
  switch (id) {
    case 'sunny':
      return <Sun size={size} className="text-money" aria-hidden />;
    case 'cloudy':
      return <Cloud size={size} className="text-dim" aria-hidden />;
    case 'rain':
      return <CloudRain size={size} className="text-water" aria-hidden />;
    case 'dust':
      return <Tornado size={size} className="text-warn" aria-hidden />;
  }
}
