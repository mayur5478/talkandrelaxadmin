import React from "react";
import { Table } from "react-bootstrap";
import { useWalletReportQuery } from "../../services/auth";

const Top10Wallets = () => {
    const { data, isLoading, error } = useWalletReportQuery();

    if (isLoading) return <p>Loading Top 10 Wallets...</p>;
    if (error) return <p className="text-red">Error loading wallet report</p>;

    return (
        <div className="table p-3 mt-4" style={{ backgroundColor: '#fff', borderRadius: '15px' }}>
            <div className="topbar mb-3">
                <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Top 10 Wallet Balances</p>
                <p>Total Platform Balance: ₹{data?.totalBalance}</p>
            </div>
            <Table responsive hover className="custom-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Mobile</th>
                        <th>Role</th>
                        <th>Balance</th>
                    </tr>
                </thead>
                <tbody>
                    {data?.top10?.map((w, index) => (
                        <tr key={index}>
                            <td>{index + 1}</td>
                            <td>{w.name}</td>
                            <td>{w.mobile}</td>
                            <td>
                                <span className={`badge ${w.role === 'listener' ? 'bg-info' : 'bg-primary'}`}>
                                    {w.role}
                                </span>
                            </td>
                            <td style={{ fontWeight: 'bold', color: '#2AA33D' }}>₹{w.balance}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};

export default Top10Wallets;
