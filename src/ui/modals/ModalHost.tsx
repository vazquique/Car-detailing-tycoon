import { useUi } from '../../store/uiStore';
import { SettingsModal } from './SettingsModal';
import { FranchiseModal } from './FranchiseModal';
import {
  BayDetailModal,
  CustomerModal,
  DaySummaryModal,
  ForecastModal,
  OfflineModal,
} from './SimpleModals';

export function ModalHost() {
  const modal = useUi((u) => u.modal);
  const close = useUi((u) => u.closeModal);
  if (!modal) return null;
  switch (modal.kind) {
    case 'settings':
      return <SettingsModal onClose={close} />;
    case 'daySummary':
      return <DaySummaryModal summary={modal.summary} onClose={close} />;
    case 'offline':
      return <OfflineModal result={modal.result} onClose={close} />;
    case 'franchise':
      return <FranchiseModal onClose={close} />;
    case 'bayDetail':
      return <BayDetailModal bayId={modal.bayId} onClose={close} />;
    case 'customer':
      return <CustomerModal customerId={modal.customerId} onClose={close} />;
    case 'forecast':
      return <ForecastModal onClose={close} />;
    case 'install':
      return <SettingsModal onClose={close} />;
  }
}
