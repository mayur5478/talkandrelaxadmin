import React from 'react';
import { Modal, Table, Button, Badge, Spinner } from 'react-bootstrap';
import { useAllWalletsQuery } from '../../services/auth';

const WalletModal = ({ show, handleClose, title, type = 'user' }) => {
  const { data, isLoading, error } = useAllWalletsQuery({ type, limit: 100 }, { skip: !show });
  const wallets = data?.wallets || [];

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered className="modern-modal">
      <Modal.Header closeButton className="border-0 px-4 pt-4">
        <Modal.Title className="fw-bold h4">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="px-4 pb-4">
        {isLoading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 text-muted">Loading full list...</p>
          </div>
        ) : error ? (
          <div className="text-center py-5 text-danger">
            Error loading data. Please try again.
          </div>
        ) : (
          <div className="table-responsive">
            <Table hover align="middle" className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="border-0 text-muted small text-uppercase fw-bold px-3 py-3">Rank</th>
                  <th className="border-0 text-muted small text-uppercase fw-bold px-3 py-3">Name</th>
                  <th className="border-0 text-muted small text-uppercase fw-bold px-3 py-3">Email</th>
                  <th className="border-0 text-muted small text-uppercase fw-bold px-3 py-3 text-end">Wallet Balance</th>
                </tr>
              </thead>
              <tbody>
                {wallets.length > 0 ? (
                  wallets.map((wallet, index) => (
                    <tr key={wallet.id || index}>
                      <td className="px-3 py-3">
                        <Badge bg={index < 3 ? 'warning' : 'light'} text={index < 3 ? 'dark' : 'secondary'} className="rounded-pill px-3">
                          #{index + 1}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 fw-bold">{wallet.userName}</td>
                      <td className="px-3 py-3 text-secondary">{wallet.email}</td>
                      <td className="px-3 py-3 text-end fw-bold text-success">
                        ₹{parseFloat(wallet.balance).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-5 text-muted">No records found</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="border-0 px-4 pb-4">
        <Button variant="secondary" onClick={handleClose} className="rounded-3 px-4">
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default WalletModal;
