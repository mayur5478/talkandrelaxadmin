import React, { useCallback, useEffect, useState } from "react";
import display from "../../assets/display-image.png";
import "./listenerDetails.scss";
import { Badge, Button, Col, Form, Row } from "react-bootstrap";
import { useDropzone } from "react-dropzone";
import { useListenerProfileQuery } from "../../../services/listener";
import { useLocation } from "react-router-dom";
import { useUpdateListenerProfileMutation } from "../../../services/auth";

function ListenerDetailsForm() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [adharFront, setAdharFront] = useState(null);
  const [adharBack, setAdharBack] = useState(null);
  const [panCard, setPanCard] = useState(null);
  const [isUpdateLoad, setIsUpdateLoad] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile_number: "",
    dob: "",
    gender: "",
    age: "",
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    upi_id: "",
    availability: "",
    about: "",
  });

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const id = searchParams.get("id");

  const { data, error, isLoading, refetch } = useListenerProfileQuery(id);
  const [updateListenerProfile] = useUpdateListenerProfileMutation();

  useEffect(() => {
    if (data) {
      const profile = data.profile;
      const profileData = data.profile.listenerProfileData[0];
      setFormData({
        fullName: profileData.display_name || "",
        email: profile.email || "",
        mobile_number: profile.mobile_number || "",
        dob: profileData.dob ? profileData.dob.split("T")[0] : "",
        gender: profileData.gender || "",
        age: profileData.age || "",
        availability: profileData.call_availability_duration || "",
        bank_name: profileData.bank_name || "",
        account_number: profileData.account_number || "",
        ifsc_code: profileData.ifsc_code || "",
        upi_id: profileData.upi_id || "",
        about: profileData.about || "",
      });
      setSelectedImage(profileData.display_image || display);
      setFormDatas({
        services: profileData.service || [],
        topics: profileData.topic || [],
        languages: profileData.languages || [],
      });
      // Set initial document images
      setAdharFront(
        profileData.adhar_front ? { preview: profileData.adhar_front } : null
      );
      setAdharBack(
        profileData.adhar_back ? { preview: profileData.adhar_back } : null
      );
      setPanCard(profileData.pancard ? { preview: profileData.pancard } : null);
    }
  }, [data]);

  // Handle form field changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle file drop for image uploads
  const handleDrop = useCallback((acceptedFiles, setImage) => {
    const file = acceptedFiles[0];
    setImage(
      Object.assign(file, {
        preview: URL.createObjectURL(file),
      })
    );
  }, []);

  const {
    getRootProps: getAdharFrontProps,
    getInputProps: getAdharFrontInputProps,
  } = useDropzone({
    onDrop: (files) => handleDrop(files, setAdharFront),
    accept: "image/*",
  });

  const {
    getRootProps: getAdharBackProps,
    getInputProps: getAdharBackInputProps,
  } = useDropzone({
    onDrop: (files) => handleDrop(files, setAdharBack),
    accept: "image/*",
  });

  const { getRootProps: getPanCardProps, getInputProps: getPanCardInputProps } =
    useDropzone({
      onDrop: (files) => handleDrop(files, setPanCard),
      accept: "image/*",
    });

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
    }
  };

  const triggerFileInput = () => {
    document.getElementById("fileInput").click();
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSubmit = new FormData();
    setIsUpdateLoad(true);

    for (const key in formData) {
      formDataToSubmit.append(key, formData[key]);
    }

    formDataToSubmit.append("id", id);
    formDataToSubmit.append("services", JSON.stringify(formDatas.services));
    formDataToSubmit.append("topics", JSON.stringify(formDatas.topics));
    formDataToSubmit.append("languages", JSON.stringify(formDatas.languages));

    if (
      selectedImage &&
      typeof selectedImage === "string" &&
      selectedImage.startsWith("blob:")
    ) {
      const file = await fetch(selectedImage).then((res) => res.blob());
      formDataToSubmit.append("displayImage", file);
      URL.revokeObjectURL(selectedImage);
    }

    if (adharFront) formDataToSubmit.append("adharFront", adharFront);
    if (adharBack) formDataToSubmit.append("adharBack", adharBack);
    if (panCard) formDataToSubmit.append("pancard", panCard);

    try {
      const response = await updateListenerProfile(formDataToSubmit).unwrap();

      setFormData((prev) => ({
        ...prev,
        fullName: response.fullName,
        email: response.email,
        mobile_number: response.mobile_number,
      }));

      if (response.newDisplayImage) {
        setSelectedImage(response.newDisplayImage);
      }

      window.location.reload();
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsUpdateLoad(false);
      refetch();
      window.location.reload();
    }
  };

  const [formDatas, setFormDatas] = useState({
    services: [],
    topics: [],
    languages: [],
  });

  const [serviceOptions, setServiceOptions] = useState([]);
  const [topicOptions, setTopicOptions] = useState([]);
  const [languageOptions, setLanguageOptions] = useState([]);

  // Fetch data from API
  useEffect(() => {
    setServiceOptions(["audioCall", "videoCall", "chat", "email", "inPerson"]);
    setTopicOptions(["Loneliness", "Breakup", "Career", "Stress", "Anxiety"]);
    setLanguageOptions([
      "English",
      "Gujarati",
      "Tamil",
      "Telugu",
      "Marwadi",
      "Urdu",
      "Hindi",
      "Punjabi",
      "Haryanvi",
      "Marathi",
      "Bengali",
      "Kannada",
      "Malayalam",
      "Odia",
      "Sindhi"
    ]);
  }, []);

  const handleMultiSelectChange = (e, type) => {
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );

    if (selectedOptions.length + formDatas[type].length > 3) return; // Limit to 3 selections

    setFormDatas((prev) => ({
      ...prev,
      [type]: [
        ...prev[type],
        ...selectedOptions.filter((option) => !prev[type].includes(option)),
      ],
    }));
  };

  const removeSelectedOption = (type, option) => {
    setFormDatas((prev) => ({
      ...prev,
      [type]: prev[type].filter((item) => item !== option),
    }));
  };

  const profileDatas = data?.profile?.listenerProfileData[0];
  const finalImageUrl = profileDatas?.display_image
    ? `${profileDatas?.display_image}?v=${new Date().getTime()}`
    : display;
  return (
    <div className="listener-form-main">
      <div className="detail-sec">
        <div className="image-uploader">
          <div className="image-container">
            {selectedImage !== null ? (
              <img
                src={selectedImage}
                alt="Selected"
                className="rounded-image"
              />
            ) : (
              <img
                src={finalImageUrl}
                alt="Selected"
                className="rounded-image"
              />
            )}
            <div className="edit-caption">
              <button className="edit-button" onClick={triggerFileInput}>
                Edit
              </button>
            </div>
          </div>
          <input
            id="fileInput"
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleImageChange}
          />
        </div>

        <Form onSubmit={handleSubmit}>
          <Row className="mb-3">
            <Form.Group as={Col} controlId="formGridEmail">
              <Form.Label>Full Name:</Form.Label>
              <Form.Control
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="First Name"
              />
            </Form.Group>
          </Row>
          <Row className="mb-3">
            <Form.Group as={Col} controlId="formGridEmail">
              <Form.Label>Email ID:</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email"
              />
            </Form.Group>
            <Form.Group as={Col} controlId="formGridPassword">
              <Form.Label>Contact Number:</Form.Label>
              <Form.Control
                type="number"
                name="mobile_number"
                value={formData.mobile_number}
                onChange={handleInputChange}
                placeholder="Contact Number"
              />
            </Form.Group>
          </Row>
          <Row className="mb-3">
            <Form.Group as={Col} controlId="formGridEmail">
              <Form.Label>Date of Birth:</Form.Label>
              <Form.Control
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleInputChange}
                placeholder="Dob"
              />
            </Form.Group>
            <Form.Group as={Col} controlId="formGender">
              <Form.Label>Gender:</Form.Label>
              <Form.Select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
              >
                <option value="" disabled>
                  Choose...
                </option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </Form.Select>
            </Form.Group>
          </Row>
          <Row className="mb-3">
            <Form.Group as={Col} controlId="formGridEmail">
              <Form.Label>Age:</Form.Label>
              <Form.Control
                type="number"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                placeholder="Age"
              />
            </Form.Group>
            <Form.Group as={Col} controlId="formGridEmail">
              <Form.Label>Availability:</Form.Label>
              <Form.Control
                type="text"
                name="availability"
                value={formData.availability}
                onChange={handleInputChange}
                placeholder="Availability "
              />
            </Form.Group>
          </Row>
          <Row>
            <Form.Group as={Col} controlId="formServices" className="mb-3">
              <Form.Label>Services:</Form.Label>
              <Form.Select
                onChange={(e) => handleMultiSelectChange(e, "services")}
              >
                {serviceOptions.map((service) => (
                  <option
                    key={service}
                    value={service}
                    disabled={formDatas.services.includes(service)}
                  >
                    {service}
                  </option>
                ))}
              </Form.Select>
              <div className="mt-2 ">
                {formDatas.services.map((service, index) => (
                  <Badge
                    key={index}
                    bg="primary"
                    className="select-badge me-2"
                    onClick={() => removeSelectedOption("services", service)}
                  >
                    {service} <span className="remove-badge">x</span>
                  </Badge>
                ))}
              </div>
            </Form.Group>

            <Form.Group as={Col} controlId="formTopics" className="mb-3">
              <Form.Label>Topics:</Form.Label>
              <Form.Select
                onChange={(e) => handleMultiSelectChange(e, "topics")}
              >
                {topicOptions.map((topic) => (
                  <option
                    key={topic}
                    value={topic}
                    disabled={formDatas.topics.includes(topic)}
                  >
                    {topic}
                  </option>
                ))}
              </Form.Select>
              <div className="mt-2">
                {formDatas.topics.map((topic, index) => (
                  <Badge
                    key={index}
                    bg="success"
                    className="select-badge me-2"
                    onClick={() => removeSelectedOption("topics", topic)}
                  >
                    {topic} <span className="remove-badge">x</span>
                  </Badge>
                ))}
              </div>
            </Form.Group>
            <Form.Group controlId="formLanguages" className="mb-3">
              <Form.Label>Languages:</Form.Label>
              <Form.Select
                onChange={(e) => handleMultiSelectChange(e, "languages")}
              >
                {languageOptions.map((language) => (
                  <option
                    key={language}
                    value={language}
                    disabled={formDatas.languages.includes(language)}
                  >
                    {language}
                  </option>
                ))}
              </Form.Select>
              <div className="mt-2">
                {formDatas.languages.map((language, index) => (
                  <Badge
                    key={index}
                    bg="success"
                    className="select-badge me-2"
                    onClick={() => removeSelectedOption("languages", language)}
                  >
                    {language} <span className="remove-badge">x</span>
                  </Badge>
                ))}
              </div>
            </Form.Group>
          </Row>
          <Form.Group className="mb-3" controlId="exampleForm.ControlTextarea1">
            <Form.Label>About me:</Form.Label>
            <Form.Control
              name="about"
              value={formData.about}
              onChange={handleInputChange}
              as="textarea"
              rows={3}
            />
          </Form.Group>
          <Row className="mb-3">
            <Form.Group as={Col} controlId="formGridEmail">
              <Form.Label>Bank Name:</Form.Label>
              <Form.Control
                type="text"
                name="bank_name"
                value={formData.bank_name}
                onChange={handleInputChange}
                placeholder="Bank Name"
              />
            </Form.Group>
            <Form.Group as={Col} controlId="formGridPassword">
              <Form.Label>Account Number:</Form.Label>
              <Form.Control
                type="number"
                name="account_number"
                value={formData.account_number}
                onChange={handleInputChange}
                placeholder="Account Number"
              />
            </Form.Group>
          </Row>
          <Row className="mb-3">
            <Form.Group as={Col} controlId="formGridEmail">
              <Form.Label>IFSC Code:</Form.Label>
              <Form.Control
                type="text"
                name="ifsc_code"
                value={formData.ifsc_code}
                onChange={handleInputChange}
                placeholder="IFSC Code"
              />
            </Form.Group>
            <Form.Group as={Col} controlId="formGridPassword">
              <Form.Label>UPI ID:</Form.Label>
              <Form.Control
                type="text"
                name="upi_id"
                value={formData.upi_id}
                onChange={handleInputChange}
                placeholder="UPI ID"
              />
            </Form.Group>
          </Row>
          <Form.Label>Documents:</Form.Label>
          <div className="documents-upload">
            <div className="drop-box" {...getAdharFrontProps()}>
              <input {...getAdharFrontInputProps()} />
              {adharFront?.preview ? (
                <img
                  src={`${adharFront.preview}?v=${new Date().getTime()}`}
                  alt="Adhar Card Front"
                  className="preview-image"
                />
              ) : (
                <p>Upload Adhar Card Front</p>
              )}
            </div>

            <div className="drop-box" {...getAdharBackProps()}>
              <input {...getAdharBackInputProps()} />
              {adharBack?.preview ? (
                <img
                  src={`${adharBack.preview}?v=${new Date().getTime()}`}
                  alt="Adhar Card Back"
                  className="preview-image"
                />
              ) : (
                <p>Upload Adhar Card Back</p>
              )}
            </div>

            <div className="drop-box" {...getPanCardProps()}>
              <input {...getPanCardInputProps()} />
              {panCard?.preview ? (
                <img
                  src={`${panCard.preview}?v=${new Date().getTime()}`}
                  alt="Pancard"
                  className="preview-image"
                />
              ) : (
                <p>Upload Pancard</p>
              )}
            </div>
          </div>
          <div className="buttons">
            <Button type="submit" className="profile-btn">
              {isUpdateLoad ? "Wait..." : "Save"}
            </Button>
            <Button className="profile-btn">Cancel</Button>
          </div>
        </Form>
      </div>
    </div>
  );
}

export default ListenerDetailsForm;
