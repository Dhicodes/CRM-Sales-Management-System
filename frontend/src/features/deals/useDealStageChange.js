import { useState } from 'react';
import { useChangeDealStageMutation } from './dealsApi';
import { useToast } from '../../components/ToastProvider';
import { CLOSED_STAGES } from '../../utils/dealOptions';

// Shared by DealDetailPage's stage dropdown and DealsListPage's Kanban drag
// target both need the exact same business rules (Won/Lost confirmation,
// loss-reason requirement, admin-only reopen) so they must not drift apart.
export function useDealStageChange() {
  const [changeStage, { isLoading }] = useChangeDealStageMutation();
  const { showSuccess, showError } = useToast();

  const [stageConfirm, setStageConfirm] = useState(null); // { id, nextStage, message }
  const [lossReasonTarget, setLossReasonTarget] = useState(null); // deal id
  const [lossReason, setLossReason] = useState('');

  const runStageChange = async (id, payload) => {
    try {
      await changeStage({ id, ...payload }).unwrap();
      showSuccess('Deal stage updated');
    } catch (err) {
      showError(err.data?.message || 'Failed to update stage');
    } finally {
      setStageConfirm(null);
      setLossReasonTarget(null);
      setLossReason('');
    }
  };

  const requestStageChange = (deal, nextStage) => {
    if (nextStage === deal.stage) return;

    if (nextStage === 'Lost') {
      setLossReasonTarget(deal._id);
      return;
    }
    if (nextStage === 'Won') {
      setStageConfirm({ id: deal._id, nextStage, message: 'Mark this deal as Won? This closes the deal.' });
      return;
    }
    if (CLOSED_STAGES.includes(deal.stage)) {
      setStageConfirm({
        id: deal._id,
        nextStage,
        message: `Reopen this deal into ${nextStage}? This clears its close date.`,
      });
      return;
    }
    runStageChange(deal._id, { stage: nextStage });
  };

  const confirmLossReason = () => {
    if (!lossReason.trim()) return;
    runStageChange(lossReasonTarget, { stage: 'Lost', lossReason: lossReason.trim() });
  };

  return {
    isChangingStage: isLoading,
    requestStageChange,
    stageConfirm,
    confirmStageChange: () => runStageChange(stageConfirm.id, { stage: stageConfirm.nextStage }),
    cancelStageConfirm: () => setStageConfirm(null),
    lossReasonOpen: Boolean(lossReasonTarget),
    lossReason,
    setLossReason,
    confirmLossReason,
    cancelLossReason: () => {
      setLossReasonTarget(null);
      setLossReason('');
    },
  };
}
