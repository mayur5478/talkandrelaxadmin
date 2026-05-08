import React from 'react';

const WalletList = ({ wallets }) => {
  if (!wallets || wallets.length === 0) {
    return (
      <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-10 tw-gap-1">
        <span className="tw-text-[13px] tw-text-fg-tertiary">No wallet data yet</span>
        <span className="tw-text-[11px] tw-text-fg-tertiary tw-opacity-60">
          Data will appear as wallets are credited.
        </span>
      </div>
    );
  }

  return (
    <div className="tw-flex tw-flex-col tw-gap-[6px] tw-pt-2">
      {wallets.map((w, index) => (
        <div
          key={w.id || index}
          className="tw-flex tw-items-center tw-justify-between tw-px-3 tw-py-3 tw-rounded-lg tw-border tw-border-hairline tw-border-tertiary tw-bg-bg-secondary hover:tw-bg-bg-tertiary tw-transition-colors tw-duration-fast"
        >
          {/* Rank + user info */}
          <div className="tw-flex tw-items-center tw-gap-3 tw-min-w-0">
            <div
              className="tw-flex tw-items-center tw-justify-center tw-rounded-full tw-text-white tw-text-[13px] tw-font-bold tw-shrink-0"
              style={{
                width: 34,
                height: 34,
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              }}
            >
              {index + 1}
            </div>
            <div className="tw-min-w-0">
              <div className="tw-text-[13px] tw-font-semibold tw-text-fg-primary tw-truncate leading-tight">
                {w.userName}
              </div>
              <div className="tw-text-[11px] tw-text-fg-tertiary tw-truncate tw-max-w-[160px] leading-tight tw-mt-[2px]">
                {w.email}
              </div>
            </div>
          </div>

          {/* Balance */}
          <div className="tw-text-right tw-shrink-0 tw-pl-2">
            <div className="tw-text-[14px] tw-font-bold tw-text-fg-success tw-tabular-nums leading-tight">
              ₹{parseFloat(w.balance || 0).toFixed(2)}
            </div>
            <div className="tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-wider tw-text-fg-tertiary tw-mt-[2px] leading-tight">
              Balance
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default WalletList;
