import React, { useEffect, useState, useRef } from "react";
import "./onboardingForm.scss";

const API_BASE = (process.env.REACT_APP_SERVER_URL || "").replace(/\/?$/, "/");

function OnboardingForm() {
  const token = window.location.pathname.split("/onboarding/")[1];

  const [loading, setLoading] = useState(true);
  const [formInfo, setFormInfo] = useState(null);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Form 1 state
  const [f1, setF1] = useState({
    fullName: "", gender: "", dob: "", mobile_number: "", email: "",
    reference: "", answer1: "", answer2: "", answer3: "", answer4: "",
  });
  const [resume, setResume] = useState(null);
  const [audioFile, setAudioFile] = useState(null);

  // Form 2 state
  const [f2, setF2] = useState({
    display_name: "", gender: "", age: "", dob: "",
    about: "", call_availability_duration: "",
    bank_name: "", account_number: "", ifsc_code: "", upi_id: "",
    topic: [], service: [], languages: [],
  });
  const [f2Files, setF2Files] = useState({
    profileImage: null, displayImage: null,
    adharFront: null, adharBack: null, pancard: null,
  });

  const TOPICS = ["Stress", "Anxiety", "Relationship", "Career", "Family", "Grief", "Loneliness", "Other"];
  const SERVICES = ["Voice Call", "Chat", "Video Call"];
  const LANGUAGES = ["Hindi", "English", "Tamil", "Telugu", "Kannada", "Marathi", "Bengali", "Gujarati", "Other"];
  const AVAILABILITY = ["1-2 hours", "2-4 hours", "4-6 hours", "6-8 hours", "Full day"];

  useEffect(() => {
    if (!token) { setError("Invalid link."); setLoading(false); return; }
    fetch(`${API_BASE}onboarding/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.data) {
          setFormInfo(data.data);
          if (data.data.formStep === 1) {
            setF1((prev) => ({
              ...prev,
              email: data.data.userEmail || "",
              fullName: data.data.userName || "",
              mobile_number: data.data.userMobile || "",
            }));
          } else if (data.data.formStep === 2) {
            setF2((prev) => ({ ...prev, display_name: data.data.userName || "" }));
          }
        } else {
          setError(data.message || "Invalid or expired link.");
        }
        setLoading(false);
      })
      .catch(() => { setError("Failed to load form. Please try again."); setLoading(false); });
  }, [token]);

  const handleF1Change = (e) => setF1((p) => ({ ...p, [e.target.name]: e.target.value }));
  const handleF2Change = (e) => setF2((p) => ({ ...p, [e.target.name]: e.target.value }));

  const toggleArray = (key, val) =>
    setF2((p) => ({
      ...p,
      [key]: p[key].includes(val) ? p[key].filter((x) => x !== val) : [...p[key], val],
    }));

  const MAX_FILE_MB = 15;
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    if (file && file.size > MAX_FILE_MB * 1024 * 1024) {
      setSubmitError(`"${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is ${MAX_FILE_MB} MB. Please compress the image and try again.`);
      e.target.value = "";
      return;
    }
    setSubmitError("");
    if (name === "resume") setResume(file);
    else if (name === "audioFile") setAudioFile(file);
    else setF2Files((p) => ({ ...p, [name]: file }));
  };

  const submitForm1 = async (e) => {
    e.preventDefault();
    if (!resume) { setSubmitError("Please upload your resume."); return; }
    setSubmitting(true);
    setSubmitError("");
    try {
      const fd = new FormData();
      fd.append("userId", formInfo.userId);
      Object.entries(f1).forEach(([k, v]) => fd.append(k, v));
      fd.append("resume", resume);
      if (audioFile) fd.append("audioFile", audioFile);

      const res = await fetch(`${API_BASE}onboarding/form-1/${token}`, { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) { setSubmitted(true); }
      else { setSubmitError(data.message || "Submission failed. Please try again."); }
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitForm2 = async (e) => {
    e.preventDefault();
    const missing = ["profileImage", "displayImage", "adharFront", "adharBack", "pancard"].filter(
      (k) => !f2Files[k]
    );
    if (missing.length > 0) { setSubmitError(`Please upload: ${missing.join(", ")}`); return; }
    if (f2.topic.length === 0) { setSubmitError("Please select at least one topic."); return; }
    if (f2.service.length === 0) { setSubmitError("Please select at least one service."); return; }
    if (f2.languages.length === 0) { setSubmitError("Please select at least one language."); return; }

    setSubmitting(true);
    setSubmitError("");
    try {
      const fd = new FormData();
      Object.entries(f2).forEach(([k, v]) => {
        if (Array.isArray(v)) fd.append(k, JSON.stringify(v));
        else fd.append(k, v);
      });
      Object.entries(f2Files).forEach(([k, v]) => { if (v) fd.append(k, v); });

      const res = await fetch(`${API_BASE}onboarding/form-2/${token}`, { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) { setSubmitted(true); }
      else { setSubmitError(data.message || "Submission failed. Please try again."); }
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="onboarding-page">
      <div className="onboarding-card">
        <div className="onboarding-logo">Talk and Relax</div>
        <p className="loading-text">Loading your form...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="onboarding-page">
      <div className="onboarding-card">
        <div className="onboarding-logo">Talk and Relax</div>
        <div className="onboarding-error-box">
          <h3>Unable to load form</h3>
          <p>{error}</p>
          <p>If you need help, please contact <strong>support@talkandrelax.com</strong></p>
        </div>
      </div>
    </div>
  );

  if (submitted) return (
    <div className="onboarding-page">
      <div className="onboarding-card">
        <div className="onboarding-logo">Talk and Relax</div>
        <div className="onboarding-success-box">
          <div className="success-icon">✓</div>
          <h3>Form Submitted Successfully!</h3>
          {formInfo?.formStep === 1 ? (
            <p>Thank you for completing your application. Our team will review it and reach out to you soon.</p>
          ) : (
            <p>Thank you for submitting your profile and documents. Our team will verify them and get back to you.</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="onboarding-page">
      <div className="onboarding-card">
        <div className="onboarding-logo">Talk and Relax</div>

        {formInfo?.formStep === 1 && (
          <>
            <div className="onboarding-header">
              <span className="step-badge">Step 1 of 2</span>
              <h2>Listener Application Form</h2>
              <p>Please fill out this form to apply as a Talk and Relax listener.</p>
            </div>

            <form onSubmit={submitForm1} className="onboarding-form">
              <div className="form-section">
                <h4>Personal Information</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input name="fullName" value={f1.fullName} onChange={handleF1Change} required placeholder="Your full name" />
                  </div>
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input type="email" name="email" value={f1.email} onChange={handleF1Change} required placeholder="your@email.com" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Mobile Number *</label>
                    <input type="tel" name="mobile_number" value={f1.mobile_number} onChange={handleF1Change} required placeholder="10-digit mobile number" />
                  </div>
                  <div className="form-group">
                    <label>Date of Birth *</label>
                    <input type="date" name="dob" value={f1.dob} onChange={handleF1Change} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Gender *</label>
                    <select name="gender" value={f1.gender} onChange={handleF1Change} required>
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Reference (how did you hear about us?)</label>
                    <input name="reference" value={f1.reference} onChange={handleF1Change} placeholder="e.g. Friend, Social Media, Google" />
                  </div>
                </div>
              </div>

              {formInfo.questions && (
                <div className="form-section">
                  <h4>Screening Questions</h4>
                  {[1, 2, 3, 4].map((n) =>
                    formInfo.questions[`question${n}`] ? (
                      <div className="form-group" key={n}>
                        <label>{formInfo.questions[`question${n}`]} *</label>
                        <textarea
                          name={`answer${n}`}
                          value={f1[`answer${n}`]}
                          onChange={handleF1Change}
                          rows={3}
                          placeholder="Your answer..."
                        />
                      </div>
                    ) : null
                  )}
                </div>
              )}

              <div className="form-section">
                <h4>Documents</h4>
                <div className="form-row">
                  <div className="form-group file-upload-group">
                    <label>Resume / CV * <span className="hint">(PDF, DOC — max 10MB)</span></label>
                    <div className="file-upload-box">
                      <input type="file" name="resume" id="resume" onChange={handleFileChange} accept=".pdf,.doc,.docx" required />
                      <label htmlFor="resume" className="file-upload-label">
                        {resume ? (
                          <span className="file-chosen">✓ {resume.name}</span>
                        ) : (
                          <span className="file-placeholder">Click to upload</span>
                        )}
                      </label>
                    </div>
                  </div>
                  <div className="form-group file-upload-group">
                    <label>Audio Introduction <span className="hint">(MP3, WAV, WEBM — optional)</span></label>
                    <div className="file-upload-box">
                      <input type="file" name="audioFile" id="audioFile" onChange={handleFileChange} accept="audio/*" />
                      <label htmlFor="audioFile" className="file-upload-label">
                        {audioFile ? (
                          <span className="file-chosen">✓ {audioFile.name}</span>
                        ) : (
                          <span className="file-placeholder">Click to upload</span>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {submitError && <div className="onboarding-submit-error">{submitError}</div>}

              <button type="submit" className="submit-btn" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Application"}
              </button>
            </form>
          </>
        )}

        {formInfo?.formStep === 2 && (
          <>
            <div className="onboarding-header">
              <span className="step-badge">Step 2 of 2</span>
              <h2>Complete Your Listener Profile</h2>
              <p>Please provide your profile information and upload the required documents.</p>
            </div>

            <form onSubmit={submitForm2} className="onboarding-form">
              <div className="form-section">
                <h4>Profile Information</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Display Name *</label>
                    <input name="display_name" value={f2.display_name} onChange={handleF2Change} required placeholder="Name shown to users" />
                  </div>
                  <div className="form-group">
                    <label>Gender *</label>
                    <select name="gender" value={f2.gender} onChange={handleF2Change} required>
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Age *</label>
                    <input type="number" name="age" value={f2.age} onChange={handleF2Change} required min="18" max="70" />
                  </div>
                  <div className="form-group">
                    <label>Date of Birth *</label>
                    <input type="date" name="dob" value={f2.dob} onChange={handleF2Change} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>About You *</label>
                  <textarea name="about" value={f2.about} onChange={handleF2Change} required rows={4} placeholder="Tell users about yourself, your experience, and why you want to be a listener..." />
                </div>
                <div className="form-group">
                  <label>Call Availability *</label>
                  <select name="call_availability_duration" value={f2.call_availability_duration} onChange={handleF2Change} required>
                    <option value="">Select availability per day</option>
                    {AVAILABILITY.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-section">
                <h4>Specialisation</h4>
                <div className="form-group">
                  <label>Topics You Can Help With *</label>
                  <div className="chip-group">
                    {TOPICS.map((t) => (
                      <button type="button" key={t}
                        className={`chip ${f2.topic.includes(t) ? "chip-active" : ""}`}
                        onClick={() => toggleArray("topic", t)}>{t}</button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>Services You Offer *</label>
                  <div className="chip-group">
                    {SERVICES.map((s) => (
                      <button type="button" key={s}
                        className={`chip ${f2.service.includes(s) ? "chip-active" : ""}`}
                        onClick={() => toggleArray("service", s)}>{s}</button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>Languages You Speak *</label>
                  <div className="chip-group">
                    {LANGUAGES.map((l) => (
                      <button type="button" key={l}
                        className={`chip ${f2.languages.includes(l) ? "chip-active" : ""}`}
                        onClick={() => toggleArray("languages", l)}>{l}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4>Bank Details <span className="hint">(for earnings payment)</span></h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Bank Name</label>
                    <input name="bank_name" value={f2.bank_name} onChange={handleF2Change} placeholder="e.g. HDFC Bank" />
                  </div>
                  <div className="form-group">
                    <label>Account Number</label>
                    <input name="account_number" value={f2.account_number} onChange={handleF2Change} placeholder="Bank account number" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>IFSC Code</label>
                    <input name="ifsc_code" value={f2.ifsc_code} onChange={handleF2Change} placeholder="e.g. HDFC0001234" />
                  </div>
                  <div className="form-group">
                    <label>UPI ID</label>
                    <input name="upi_id" value={f2.upi_id} onChange={handleF2Change} placeholder="e.g. name@upi" />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4>Photos & Documents *</h4>
                <p className="section-note">All documents are required. Please upload clear, readable images (JPG/PNG, max 10MB each).</p>
                <div className="form-row">
                  <FileUploadField label="Profile Photo *" name="profileImage" file={f2Files.profileImage} onChange={handleFileChange} />
                  <FileUploadField label="Display Photo *" name="displayImage" file={f2Files.displayImage} onChange={handleFileChange} />
                </div>
                <div className="form-row">
                  <FileUploadField label="Aadhaar Card (Front) *" name="adharFront" file={f2Files.adharFront} onChange={handleFileChange} />
                  <FileUploadField label="Aadhaar Card (Back) *" name="adharBack" file={f2Files.adharBack} onChange={handleFileChange} />
                </div>
                <div className="form-row">
                  <FileUploadField label="PAN Card *" name="pancard" file={f2Files.pancard} onChange={handleFileChange} />
                </div>
              </div>

              {submitError && <div className="onboarding-submit-error">{submitError}</div>}

              <button type="submit" className="submit-btn" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Profile"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function FileUploadField({ label, name, file, onChange }) {
  return (
    <div className="form-group file-upload-group">
      <label>{label}</label>
      <div className="file-upload-box">
        <input type="file" name={name} id={name} onChange={onChange} accept="image/*" />
        <label htmlFor={name} className="file-upload-label">
          {file ? (
            <span className="file-chosen">✓ {file.name}</span>
          ) : (
            <span className="file-placeholder">Click to upload</span>
          )}
        </label>
      </div>
    </div>
  );
}

export default OnboardingForm;
