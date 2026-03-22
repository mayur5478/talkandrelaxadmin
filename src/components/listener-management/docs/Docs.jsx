import React, { useState } from "react";
import "./docs.scss";
import download from "../../assets/download.png";
import file from "../../assets/File.png";
import ReactAudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import { Accordion, Button } from "react-bootstrap";
import { useLocation } from "react-router-dom";
import { useFormDataQuery } from "../../../services/user";
import moment from "moment";
import { useListenerProfileFormLinkMutation } from "../../../services/listener";
import RejectionModal from "../reject-request-modal/RejectionModal";
import LinkShare from "../../common/link-share/LinkShare";
function Docs() {
  const [modalShow, setModalShow] = useState(false);
    const location = useLocation();
 const [selectedUser, setSelectedUser] = useState(null);
    const [userName, setUserName] = useState(null);
    const [rejectedUser, setRejectedUser] = useState(null);
      const [showLinkModal, setShowLinkModal] = useState(false);
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get('id');
 
    const { data: formData, error, isLoading,refetch } = useFormDataQuery({ id });
  
     const [
        sendFormLink,
        { data: mutationData, error: mutationError, isLoading: isMutationLoading },
      ] = useListenerProfileFormLinkMutation();
      const handleSendFormLink = (userId,userName) => {
        setSelectedUser(userId);
        setShowLinkModal(true);
        setUserName(userName);
        
      }
      const confirmSendFormLink = async() => {
       
        try {
          await sendFormLink(selectedUser).unwrap();
          refetch();
        } catch (err) {
          console.error("Error toggling account freeze:", err);
        } finally {
          setSelectedUser(null);
        setShowLinkModal(false);
        setUserName(null);
        }
      };
      const haldleReject = async(userId) => {
        setModalShow(true)
        setRejectedUser(userId)
      }
  return (
    <div className="docs-main">
        {
            formData?.formData ? (
                <>
                  <div className="section-wrapper">
        <p className="title-text">Personal Information:</p>
        <div className="section-body">
          <div className="row-class">
            <div className="col-class">
              <p className="title">First Name:</p>
              <p className="description">{formData?.formData?.fullName}</p>
            </div>
            <div className="col-class">
              <p className="title">Email ID:</p>
              <p className="description">{formData?.formData?.email}</p>
            </div>
            <div className="col-class">
              <p className="title">Mobile Number:</p>
              <p className="description">{formData?.formData?.mobile_number}</p>
            </div>
          </div>
          <div className="row-class">
            <div className="col-class">
              <p className="title">Gender:</p>
              <p className="description">{formData?.formData?.gender}</p>
            </div>
            <div className="col-class">
              <p className="title">References:</p>
              <p className="description">{formData?.formData?.reference}</p>
            </div>
            <div className="col-class">
              <p className="title">Date of Birth:</p>
              <p className="description"> {moment(formData?.formData?.dob).format("MM/DD/YYYY")}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="section-wrapper mt-3">
        <p className="title-text">Recorded Voice & Resume:</p>
        <div className="section-body2">
          <div className="player">
            <ReactAudioPlayer src={formData?.formData?.audio} />
            <a href={formData?.formData?.audio} download="recorded-audio.webm">
                <img src={download} alt="Download" />
            </a>
           
          </div>
          <div className="player background">
            <img className="file" src={file} alt={file} />
            <p>{formData?.formData?.resume.split('/').pop().split('.').slice(0, -1).join('.')}</p>
            <a href={formData?.formData?.resume} download={`${formData?.formData?.fullName}-resume.pdf`}>
                <img src={download} alt="Download" />
            </a>
          </div>
        </div>
      </div>
      <div className="section-wrapper mt-3">
        <p className="title-text">Answer of System Question:</p>
        <div className="section-body3">
            <div className="faq-wrapper">
            <Accordion defaultActiveKey="0">
      <Accordion.Item eventKey="0">
        <Accordion.Header>{formData?.formData?.question1}</Accordion.Header>
        <Accordion.Body>
         {formData?.formData?.answer1}
        </Accordion.Body>
      </Accordion.Item>
      <Accordion.Item eventKey="1">
        <Accordion.Header>{formData?.formData?.question2}</Accordion.Header>
        <Accordion.Body>
          {formData?.formData?.answer2}
        </Accordion.Body>
      </Accordion.Item>
      <Accordion.Item eventKey="2">
        <Accordion.Header>{formData?.formData?.question3}</Accordion.Header>
        <Accordion.Body>
         {formData?.formData?.answer3}
        </Accordion.Body>
      </Accordion.Item>
      <Accordion.Item eventKey="3">
        <Accordion.Header>{formData?.formData?.question4}</Accordion.Header>
        <Accordion.Body>
          {formData?.formData?.answer4}
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
            </div>
</div>
      </div>
      <div className="btns">
        <Button onClick={() => haldleReject(formData?.formData?.userId)} className="reject-btn">Reject</Button>
        <Button onClick={() => handleSendFormLink(formData?.formData?.userId,formData?.formData?.fullName)} className="accept-btn">Accept</Button>
      </div></>
            ):""
        }
    <RejectionModal show={modalShow} rejectedUser={rejectedUser} refetch={refetch}
        onHide={() => setModalShow(false)}/>
         <LinkShare
        show={showLinkModal}
        onHide={() => setShowLinkModal(false)}
        onConfirm={confirmSendFormLink}
        userId={selectedUser}
        userName={userName}
      />
    </div>
  );
}

export default Docs;
