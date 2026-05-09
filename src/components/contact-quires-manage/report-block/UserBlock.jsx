import React, { useEffect, useState } from 'react';
import { Undo2 } from 'lucide-react';
import {
  useBlockUsersListQuery,
  useUnblockUserMutation,
} from '../../../services/contact';
import {
  Table, THead, TBody, TR, Th, Td,
  Pagination,
  Spinner, ErrorBanner, EmptyState,
  Button,
} from '../../v2/ui';
import Unblock from '../../common/unblock/Unblock';
import { useNavigate } from 'react-router-dom';

function UserBlock({ search }) {
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const t = setTimeout(() => { setSearchTerm(search); setPage(1); }, 500);
    return () => clearTimeout(t);
  }, [search]);

  const { data, error, isLoading, refetch } = useBlockUsersListQuery({
    page, limit: pageSize, search: searchTerm,
  });

  const totalRecords = data?.meta?.total || 0;
  const totalPages   = Math.ceil(totalRecords / (pageSize === 'all' ? totalRecords || 1 : pageSize));

  const [unblockUser, { isLoading: isUnblockLoading }] = useUnblockUserMutation();
  const [showModal, setShowModal]             = useState(false);
  const [selectedUnblock, setSelectedUnblock] = useState({});
  const [nameUnblock, setNameUnblock]         = useState({});

  const handleUnblock = (userId, listenerId, listenerName, userName) => {
    setSelectedUnblock({ userId, listenerId });
    setNameUnblock({ userName, listenerName });
    setShowModal(true);
  };

  const confirmUnblock = async () => {
    try {
      await unblockUser(selectedUnblock).unwrap();
      refetch();
    } catch (err) {
      console.error('Unblock error:', err);
    } finally {
      setShowModal(false);
      setSelectedUnblock({});
      setNameUnblock({});
    }
  };

  const navigate = useNavigate();

  if (isLoading) return <div className="tw-flex tw-justify-center tw-py-12"><Spinner size={20} className="tw-text-fg-info" /></div>;
  if (error)     return <div className="tw-p-4"><ErrorBanner title="Failed to load blocked users" /></div>;

  const rows = data?.data || [];

  return (
    <>
      <Table>
        <THead>
          <TR>
            <Th className="tw-w-16">Sr. No</Th>
            <Th>Reported by (Listener)</Th>
            <Th>Report for (User)</Th>
            <Th align="right">Unblock</Th>
          </TR>
        </THead>
        <TBody>
          {rows.length === 0 ? (
            <TR isLast>
              <Td colSpan={4}>
                <EmptyState title="No blocked users" description="No users have been blocked yet." />
              </Td>
            </TR>
          ) : (
            rows.map((item, index) => (
              <TR key={item.id} isLast={index === rows.length - 1}>
                <Td className="tw-text-fg-tertiary tw-font-medium">
                  {(page - 1) * pageSize + index + 1}
                </Td>
                <Td>
                  <span
                    onClick={() => navigate(`/dashboard/listener-management/profile-view?id=${item?.listenerId}`)}
                    className="tw-text-fg-info tw-font-medium tw-cursor-pointer hover:tw-underline"
                  >
                    {item?.listenerInfo?.display_name || '—'}
                  </span>
                </Td>
                <Td>
                  <span
                    onClick={() => navigate(`/dashboard/user-management/profile-view?id=${item?.userId}`)}
                    className="tw-text-fg-info tw-font-medium tw-cursor-pointer hover:tw-underline"
                  >
                    {item?.userInfo?.fullName || '—'}
                  </span>
                </Td>
                <Td align="right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnblock(
                      item?.userId,
                      item?.listenerId,
                      item?.listenerInfo?.display_name,
                      item?.userInfo?.fullName,
                    )}
                  >
                    <Undo2 size={13} aria-hidden />
                    Unblock
                  </Button>
                </Td>
              </TR>
            ))
          )}
        </TBody>
      </Table>

      <Pagination
        page={page}
        totalPages={totalPages}
        totalRecords={totalRecords}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSize={(v) => { setPageSize(v); setPage(1); }}
      />

      <Unblock
        show={showModal}
        onHide={() => setShowModal(false)}
        onConfirm={confirmUnblock}
        userId={selectedUnblock}
        userName={nameUnblock}
        isUnblockLoading={isUnblockLoading}
        type="user"
      />
    </>
  );
}

export default UserBlock;
