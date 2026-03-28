import React from 'react';

const WalletList = ({ title, wallets, color = "indigo" }) => {
  return (
    <div className="modern-card p-4 h-100 shadow-sm border-0">
      <div className="d-flex flex-column gap-2 mb-0">
        {wallets && wallets.length > 0 ? (
          wallets.map((w, index) => (
            <div 
              key={w.id || index} 
              className="d-flex justify-content-between align-items-center p-3 rounded-4 border border-light-subtle bg-light hover-shadow-sm transition-all"
              style={{
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer'
              }}
            >
              <div className="d-flex align-items-center gap-3">
                <div 
                   className={`d-flex align-items-center justify-content-center rounded-circle text-white shadow-sm`}
                   style={{ 
                     width: '40px', 
                     height: '40px', 
                     fontSize: '14px', 
                     fontWeight: '700',
                     background: `linear-gradient(135deg, var(--primary), var(--secondary))`
                   }}
                >
                  {index + 1}
                </div>
                <div>
                  <div className="fw-bold text-dark" style={{ fontSize: '15px' }}>{w.userName}</div>
                  <div className="text-muted small text-truncate" style={{ maxWidth: '180px' }}>{w.email}</div>
                </div>
              </div>
              <div className="text-end">
                <div className="fw-bold text-success" style={{ fontSize: '16px' }}>
                   ₹{parseFloat(w.balance || 0).toFixed(2)}
                </div>
                <div className="text-muted x-small" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Balance</div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-5">
             <div className="text-muted mb-2">No data yet</div>
             <div className="small text-muted opacity-50">Data will appear as wallets are credited.</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletList;
