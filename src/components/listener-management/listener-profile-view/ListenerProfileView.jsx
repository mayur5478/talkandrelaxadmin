import React, { useState } from "react";
import "./listenerProfileView.scss";
import learn from "../../assets/learn.png";
import profile from "../../assets/image.png";
import { Button } from "react-bootstrap";
import Rupee from "../../assets/orange-amount.png";
import locationImage from "../../assets/location.png";
import setting from "../../assets/green-setting.png";
import watch from "../../assets/watch.png";
import aadhar from "../../assets/adhar.png";
import display from "../../assets/display-image.png";
import { useListenerProfileQuery, useListenerSoftDeleteMutation } from "../../../services/listener";
import { useLocation, useNavigate } from "react-router-dom";
import moment from "moment";
import TransactionModal from "../../common/transaction-modal/TransactionModal";
import { useListenerManualRefundMutation } from "../../../services/recharge";
import ExportExcel from "../../common/export-modal/ExportExcel";
import Swal from "sweetalert2";
function ListenerProfileView() {
  const [show, setShow] = useState(false);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const id = searchParams.get("id");
  const navigate = useNavigate();
  const { data, error, isLoading,refetch } = useListenerProfileQuery(id);
  const [softDeleteModalShow, setSoftDeleteModalShow] = useState(false);
  const [softdeleteListener, { isLoading: isSoftDeleteLoading }] = useListenerSoftDeleteMutation();

  const handleView = (id) => {
    navigate(`/dashboard/listener-management/profile-form?id=${id}`);
  };

  const confirmSoftDelete = async () => {
    try {
      await softdeleteListener({
        id: id,
        status: !profileData?.is_soft_delete,
        mobile_number: profileData?.mobile_number,
      }).unwrap();
      setSoftDeleteModalShow(false);
      Swal.fire({
        icon: 'success',
        title: profileData?.is_soft_delete ? 'Restored!' : 'Soft Deleted!',
        text: `Listener has been ${profileData?.is_soft_delete ? 'restored' : 'soft deleted'} successfully.`,
      });
      navigate('/dashboard/listener-management');
    } catch (err) {
      console.error("Error soft deleting listener:", err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.data?.message || 'Soft delete failed',
      });
    }
  };

  const [listenerManualRefund, { isLoading: isRefunding }] =
      useListenerManualRefundMutation();
  
    const handleRefund = async ({ amount, type }) => {
      try {
        const res = await listenerManualRefund({ listenerId: id, amount, type }).unwrap();
  
        setShow(false);
        refetch()
      } catch (error) {}
    };
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error fetching listener profile</div>;
  }

  const profileData = data?.profile;
  const handleSubmit = () => {
    navigate("/dashboard/listener-management/profile-form");
  };
  return (
    <div className="listener-profile-view">
      {data ? (
        <>
          <div className="row-class">
            <div className="first-col">
              <div className="profile-card-top">
                <img src={learn} alt="learn" />
              </div>
              <div className="profile-card-bottom">
                <div className="edit-profile">
                  <div className="img-wrapper">
                    {" "}
                    <img
                      src={`${
                        profileData?.listenerProfileData[0]?.display_image
                      }?=${new Date().getTime()}`}
                      alt="profile"
                    />
                  </div>

                  <Button
                    onClick={() =>
                      handleView(
                        profileData?.listenerProfileData[0]?.listenerId
                      )
                    }
                    className="profile-btn"
                  >
                    Edit Profile
                  </Button>
                </div>
                <div className="refund-detail">
                  <div className="text-alignment">
                    <p className="name">
                      {profileData?.listenerProfileData[0]?.display_name}
                    </p>
                    <p className="email">{profileData?.email}</p>
                  </div>
                  <Button onClick={() => setShow(true)} className="profile-btn">Money Refund</Button>
                </div>
                <div className="text-center mt-3 mx-4">
                  <Button 
                    className={`profile-btn ${profileData?.is_soft_delete ? 'btn-success' : 'btn-danger'} border-0 w-100`}
                    style={{ backgroundColor: profileData?.is_soft_delete ? '#10b981' : '#ef4444' }}
                    onClick={() => setSoftDeleteModalShow(true)}
                  >
                    {profileData?.is_soft_delete ? 'Restore Listener' : 'Soft Delete Listener'}
                  </Button>
                </div>
                <div className="user-details">
                  <div>
                    <p className="text-1"> {profileData?.mobile_number}</p>
                    <p className="text-2">GISDF1S2XE</p>
                  </div>
                  <div>
                    <a className="text-3" href="#">
                      View Details
                    </a>
                    <p className="text-4">Available Any Time</p>
                  </div>
                </div>
                <div className="bottom-details">
                  <div>
                    <p className="p1">
                      {" "}
                      {moment(
                        profileData?.listenerProfileData[0]?.createdAt
                      ).format("DD/MM/YYYY, hh:mm A")}
                    </p>
                    <p className="p2">Registration Date:</p>
                  </div>
                  <div>
                    <p className="p1">
                      {profileData?.balance ? profileData?.balance : "0.0"}
                    </p>
                    <p className="p2">Wallet Amount:</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="second-col">
              <div className="user-card">
                <div className="left-sec">
                  <p className="title">Available Services:</p>
                  <div className="btns">
                    {profileData?.listenerProfileData[0]?.service.map(
                      (ele, index) => (
                        <>
                          <Button className="profile-btn">
                            {ele === "audioCall"
                              ? "Audio"
                              : ele === "videoCall"
                              ? "video"
                              : "chat"}
                          </Button>
                        </>
                      )
                    )}
                  </div>
                </div>
                <div className="right-sec green">
                  <img src={setting} alt="setting" />
                </div>
              </div>
              <div className="user-card">
                <div className="left-sec">
                  <p className="title">Total Income:</p>
                  <div className="text-amount">{`₹ ${profileData?.totalIncome}`}</div>
                </div>
                <div className="right-sec orange">
                  <img src={Rupee} alt="rupee" />
                </div>
              </div>
            </div>
            <div className="third-col">
              <div className="user-card">
                <div className="left-sec space">
                  <div className="upper-sec">
                    {" "}
                    <p className="title">State:</p>
                    <p className="text">{profileData?.state}</p>
                  </div>

                  <div className="lower-sec">
                    <p className="title">Country:</p>
                    <p className="text">{profileData?.nationality}</p>
                  </div>
                </div>
                <div className="right-sec dark-blue">
                  <img src={locationImage} alt="location" />
                </div>
              </div>
              <div className="user-card">
                <div className="left-sec">
                  <p className="title">Total Time Spend:</p>
                  <div className="text-amount">
                    {profileData?.totalSessionDuration}
                  </div>
                </div>
                <div className="right-sec purple">
                  <img src={watch} alt="watch" />
                </div>
              </div>
            </div>
            <div></div>
          </div>
          <div className="about">
            <div className="about-text">About me:</div>
            <p className="description">
              {profileData?.listenerProfileData[0]?.about}
            </p>
          </div>
          <div className="document">
            <div className="document-text">Human Identifier Document:</div>
            <div className="documents-data">
              <a
                href={profileData?.listenerProfileData[0]?.display_image}
                className="doc"
              >
                <img
                  src={`${
                    profileData?.listenerProfileData[0]?.display_image
                  }?=${new Date().getTime()}`}
                  alt="display-image"
                />
                <p>Display Image</p>
              </a>
              <a
                href={profileData?.listenerProfileData[0]?.adhar_front}
                className="doc"
              >
                <img
                  src={`${
                    profileData?.listenerProfileData[0]?.adhar_front
                  }?=${new Date().getTime()}`}
                  alt="aadhar-image"
                />
                <p>aadhar Image</p>
              </a>
              <a
                href={profileData?.listenerProfileData[0]?.adhar_back}
                className="doc"
              >
                <img
                  src={`${
                    profileData?.listenerProfileData[0]?.adhar_back
                  }?=${new Date().getTime()}`}
                  alt="aadhar-image"
                />
                <p>aadhar Image</p>
              </a>
              <a
                href={profileData?.listenerProfileData[0]?.pancard}
                className="doc"
              >
                <img
                  src={`${
                    profileData?.listenerProfileData[0]?.pancard
                  }?=${new Date().getTime()}`}
                  alt="aadhar-image"
                />
                <p>Pancard Image</p>
              </a>
            </div>
            <TransactionModal
              show={show}
              onClose={() => setShow(false)}
              onSave={handleRefund}
              id={id}
            />
            <ExportExcel
              show={softDeleteModalShow}
              onHide={() => setSoftDeleteModalShow(false)}
              onConfirm={confirmSoftDelete}
              userName={profileData?.display_name || profileData?.fullName}
              isDeleteUserLoading={isSoftDeleteLoading}
            />
          </div>
        </>
      ) : (
        ""
      )}
    </div>
  );
}

export default ListenerProfileView;
