import { Briefcase, Megaphone, Tag, Users, Warehouse, Wrench } from 'lucide-react';
import { useUi, type TabId } from '../store/uiStore';
import { S } from '../game/data/strings';
import { Sheet } from './components/Sheet';
import { WorkshopTab } from './tabs/WorkshopTab';
import { ServicesTab } from './tabs/ServicesTab';
import { StaffTab } from './tabs/StaffTab';
import { UpgradesTab } from './tabs/UpgradesTab';
import { MarketingTab } from './tabs/MarketingTab';
import { BusinessTab } from './tabs/BusinessTab';
import { TAB_BAR_HEIGHT } from './TabBar';

const ICONS: Record<TabId, typeof Wrench> = {
  workshop: Warehouse,
  services: Tag,
  staff: Users,
  upgrades: Wrench,
  marketing: Megaphone,
  business: Briefcase,
};

export function TabSheets() {
  const tab = useUi((u) => u.tab);
  const setTab = useUi((u) => u.setTab);
  if (!tab) return null;
  const Icon = ICONS[tab];
  return (
    <Sheet
      key={tab}
      title={S.tabTitles[tab]}
      icon={<Icon size={22} />}
      onClose={() => setTab(null)}
      bottom={`calc(${TAB_BAR_HEIGHT}px + var(--safe-bottom))`}
    >
      {tab === 'workshop' && <WorkshopTab />}
      {tab === 'services' && <ServicesTab />}
      {tab === 'staff' && <StaffTab />}
      {tab === 'upgrades' && <UpgradesTab />}
      {tab === 'marketing' && <MarketingTab />}
      {tab === 'business' && <BusinessTab />}
    </Sheet>
  );
}
