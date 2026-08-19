import ConfirmDialog from '../../components/ConfirmDialog';

// Renders the two dialogs driven by useDealStageChange: a generic confirm
// (Won / reopen) and the loss-reason prompt (Lost always requires one).
function DealStageDialogs({
  isChangingStage,
  stageConfirm,
  confirmStageChange,
  cancelStageConfirm,
  lossReasonOpen,
  lossReason,
  setLossReason,
  confirmLossReason,
  cancelLossReason,
}) {
  return (
    <>
      <ConfirmDialog
        open={Boolean(stageConfirm)}
        title="Update stage"
        message={stageConfirm?.message || ''}
        confirmLabel="Confirm"
        isLoading={isChangingStage}
        onConfirm={confirmStageChange}
        onCancel={cancelStageConfirm}
      />

      {lossReasonOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-800">Mark as Lost</h2>
            <p className="mt-1 text-sm text-slate-500">A reason is required when closing a deal as Lost.</p>
            <textarea
              autoFocus
              value={lossReason}
              onChange={(e) => setLossReason(e.target.value)}
              placeholder="e.g. Budget cut, chose a competitor…"
              rows={3}
              className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={cancelLossReason}
                disabled={isChangingStage}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={confirmLossReason}
                disabled={isChangingStage || !lossReason.trim()}
                className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
              >
                {isChangingStage ? 'Saving…' : 'Mark as Lost'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DealStageDialogs;
