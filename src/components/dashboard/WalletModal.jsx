import React from 'react';
import {
  Modal, ModalBody, ModalFooter,
  Button,
  Spinner,
  ErrorBanner,
  Table, THead, TBody, TR, Th, Td,
  Pill,
} from '../v2/ui';
import { useAllWalletsQuery } from '../../services/auth';

const WalletModal = ({ show, handleClose, title, type = 'user' }) => {
  const { data, isLoading, error } = useAllWalletsQuery(
    { type, limit: 100 },
    { skip: !show },
  );
  const wallets = data?.wallets || [];

  return (
    <Modal open={show} onClose={handleClose} title={title} size="xl">
      <ModalBody className="tw-p-0">
        {isLoading ? (
          <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-16 tw-gap-3">
            <Spinner size={24} className="tw-text-fg-info" />
            <span className="tw-text-[13px] tw-text-fg-tertiary">Loading full list…</span>
          </div>
        ) : error ? (
          <div className="tw-p-4">
            <ErrorBanner title="Failed to load wallets" message="Check your connection and try again." />
          </div>
        ) : (
          <div className="tw-max-h-[60vh] tw-overflow-y-auto">
            <Table>
              <THead>
                <TR>
                  <Th className="tw-pl-4">#</Th>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th align="right" className="tw-pr-4">Balance</Th>
                </TR>
              </THead>
              <TBody>
                {wallets.length > 0 ? (
                  wallets.map((wallet, index) => (
                    <TR key={wallet.id || index} isLast={index === wallets.length - 1}>
                      <Td className="tw-pl-4 tw-w-12">
                        <Pill tone={index < 3 ? 'warning' : 'neutral'}>
                          #{index + 1}
                        </Pill>
                      </Td>
                      <Td className="tw-font-semibold tw-text-fg-primary">{wallet.userName}</Td>
                      <Td className="tw-text-fg-tertiary">{wallet.email}</Td>
                      <Td align="right" className="tw-pr-4 tw-font-bold tw-text-fg-success">
                        ₹{parseFloat(wallet.balance || 0).toFixed(2)}
                      </Td>
                    </TR>
                  ))
                ) : (
                  <TR isLast>
                    <Td colSpan={4} className="tw-text-center tw-py-10 tw-text-fg-tertiary">
                      No records found
                    </Td>
                  </TR>
                )}
              </TBody>
            </Table>
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={handleClose}>Close</Button>
      </ModalFooter>
    </Modal>
  );
};

export default WalletModal;
