import React, { useRef, useState } from "react";
import "./onboardingForm.scss";

const API_BASE = (process.env.REACT_APP_SERVER_URL || "").replace(/\/?$/, "/");

// Public self-serve listener application entry. This is the URL that goes in
// the WorkIndia ad: https://<panel>/apply?src=workindia
// mobile → OTP → redirect into the token-based onboarding form (Form 1),
// which then chains into Form 2 automatically (backend auto_flow).
function ApplyPage() {
  const source =
    new URLSearchParams(window.location.search).get("src") || "workindia";

  const [step, setStep] = useState("mobile"); // mobile | otp | done
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [doneMessage, setDoneMessage] = useState("");
  const otpInputRef = useRef(null);

  const sendOtp = async (e) => {
    e?.preventDefault();
    if (!/^\d{10}$/.test(mobile)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}onboarding/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile_number: mobile, source }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStep("otp");
        setTimeout(() => otpInputRef.current?.focus(), 50);
      } else {
        setError(data.message || `Could not send OTP (HTTP ${res.status}).`);
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError("Please enter the OTP.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}onboarding/apply/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile_number: mobile, otp_input: otp.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || `Verification failed (HTTP ${res.status}).`);
        return;
      }
      const stage = data?.data?.stage;
      if ((stage === "form1" || stage === "form2") && data?.data?.url) {
        window.location.href = data.data.url;
        return;
      }
      // approved / under_review — nothing left to fill in.
      setDoneMessage(data.message || "Your application is under review.");
      setStep("done");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-card">
        <div className="onboarding-logo">Talk and Relax</div>

        {step === "done" ? (
          <div className="onboarding-success-box">
            <div className="success-icon">✓</div>
            <h3>Application Status</h3>
            <p>{doneMessage}</p>
            <p>
              Once approved you can log in to the Talk and Relax app with this
              mobile number and start earning.
            </p>
          </div>
        ) : (
          <>
            <div className="onboarding-header">
              <h2>Become a Listener</h2>
              <p>
                Earn from home by talking to people who need someone to listen.
                Apply in 2 simple steps — it takes about 10 minutes.
              </p>
            </div>

            {step === "mobile" && (
              <form onSubmit={sendOtp} className="onboarding-form">
                <div className="form-section">
                  <div className="form-group">
                    <label>Mobile Number *</label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={mobile}
                      onChange={(e) =>
                        setMobile(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="10-digit mobile number"
                      autoFocus
                      required
                    />
                  </div>
                </div>
                {error && (
                  <div className="onboarding-submit-error">{error}</div>
                )}
                <button type="submit" className="submit-btn" disabled={busy}>
                  {busy ? "Sending OTP..." : "Get OTP"}
                </button>
              </form>
            )}

            {step === "otp" && (
              <form onSubmit={verifyOtp} className="onboarding-form">
                <div className="form-section">
                  <div className="form-group">
                    <label>Enter the OTP sent to {mobile}</label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="OTP"
                      ref={otpInputRef}
                      required
                    />
                  </div>
                </div>
                {error && (
                  <div className="onboarding-submit-error">{error}</div>
                )}
                <button type="submit" className="submit-btn" disabled={busy}>
                  {busy ? "Verifying..." : "Verify & Start Application"}
                </button>
                <button
                  type="button"
                  className="submit-btn secondary-btn"
                  disabled={busy}
                  onClick={sendOtp}
                >
                  Resend OTP
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ApplyPage;
