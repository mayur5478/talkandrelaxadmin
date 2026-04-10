import React from "react";
import "./userProfile.scss";
import learn from "../../assets/learn.png";
import profile from "../../assets/image.png";
import { Button } from "react-bootstrap";
import Rupee from "../../assets/orange-amount.png";
import locationImage from "../../assets/location.png";
import setting from "../../assets/green-setting.png";
import watch from "../../assets/watch.png";
import aadhar from "../../assets/adhar.png";
import display from "../../assets/display-image.png";
import { useUserProfileQuery } from "../../../services/user";
import { useLocation } from "react-router-dom";
import moment from "moment";
import EditUser from "../../common/edit-user/EditUser";
import { useState } from "react";
import TransactionModal from "../../common/transaction-modal/TransactionModal";
import { useUserManualRefundMutation } from "../../../services/recharge";

function UserProfiile() {
  const [ids, setId] = useState("");
  const [show, setShow] = useState(false);
  const [editUserModal, setEditUserModal] = useState(false);
  const editUser = (id) => {
    setEditUserModal(true);
    setId(id);
  };
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const id = searchParams.get("id");
  const { data, error, isLoading,refetch } = useUserProfileQuery(id);
  const [userManualRefund, { isLoading: isRefunding }] =
    useUserManualRefundMutation();

  const handleRefund = async ({ amount, type }) => {
    try {
      const res = await userManualRefund({ userId: id, amount, type }).unwrap();

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

  const profileData = data?.user;
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
                        profileData?.user_image
                      }?t=${new Date().getTime()}`}
                      alt="profile"
                    />
                  </div>

                  <Button
                    onClick={() => editUser(profileData?.id)}
                    className="profile-btn"
                  >
                    Edit Profile
                  </Button>
                </div>
                <div className="refund-detail">
                  <div className="text-alignment">
                    <p className="name">{profileData?.fullName}</p>
                    <p className="email">{profileData?.email}</p>
                  </div>
                  <Button onClick={() => setShow(true)} className="profile-btn">
                    Money Refund
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
                      {moment(profileData?.createdAt).format(
                        "DD/MM/YYYY, hh:mm A"
                      )}
                    </p>
                    <p className="p2">Registration Date:</p>
                  </div>
                  <div>
                    <p className="p1">{`₹ ${
                      data?.wallet_balance ? data?.wallet_balance : "0.0"
                    }`}</p>
                    <p className="p2">Wallet Amount:</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="second-col">
              <div className="user-card">
                <div className="left-sec-3">
                  <p className="title">Services:</p>
                  <p>Chat: {`₹ ${data?.total_chat_amount}`} </p>
                  <p>Call: {`₹ ${data?.total_voice_amount}`}</p>
                  <p>V.Call: {`₹ ${data?.total_video_amount}`}</p>
                </div>
                <div className="right-sec green">
                  <img src={setting} alt="setting" />
                </div>
              </div>
              <div className="user-card">
                <div className="left-sec">
                  <p className="title">Total Amount Spend:</p>
                  <div className="text-amount">{`₹ ${data?.total_spend_amount}`}</div>
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
                  <div className="text-amount">-</div>
                </div>
                <div className="right-sec purple">
                  <img src={watch} alt="watch" />
                </div>
              </div>
            </div>
            <div></div>
          </div>
        </>
      ) : (
        ""
      )}
      <EditUser
        show={editUserModal}
        onHide={() => setEditUserModal(false)}
        id={ids}
        onSuccess={refetch}
      />
      <TransactionModal
        show={show}
        onClose={() => setShow(false)}
        onSave={handleRefund}
        id={id}
      />
    </div>
  );
}

export default UserProfiile;
