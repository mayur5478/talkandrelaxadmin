/*
 * ApplicationReview — combined view of Form 1 (listener profile) and
 * Form 2 (application docs) for an applicant.
 *
 * Linked from ApplicationRequests → Eye button.
 * Route: /dashboard/listener-management/application-review?id=<listenerId>
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User, FileText, Music, Download, Edit2,
  Briefcase, CreditCard, Building, Hash,
  ChevronDown, ChevronUp, X, Send,
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import ReactAudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import moment from 'moment';

import { useListenerProfileQuery, useSendOnboardingForm1Mutation, useSendOnboardingForm2Mutation } from '../../../services/listener';
import { useFormDataQuery } from '../../../services/user';
import { useUpdateListenerProfileMutation } from '../../../services/auth';
import {
  Card, Button, Avatar, Spinner,
  EmptyState, ErrorBanner, Tabs, TabsList, Tab, TabPanel,
  useToast,
} from '../ui';
import { PageHeader } from '../_lib/PageHeader';
import RejectionModal from '../../listener-management/reject-request-modal/RejectionModal';
import LinkShare from '../../common/link-share/LinkShare';

/* ─── tiny helpers ─────────────────────────────────────────────────── */

function InfoRow({ label, value }) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-0.5">
      <span className="tw-text-[11px] tw-font-medium tw-text-fg-tertiary tw-uppercase tw-tracking-wider">{label}</span>
      <span className="tw-text-[13px] tw-text-fg-primary tw-font-medium">{value || '—'}</span>
    </div>
  );
}

function SectionHeading({ icon: Icon, title }) {
  return (
    <div className="tw-flex tw-items-center tw-gap-2 tw-mb-4">
      {Icon && <Icon size={15} className="tw-text-fg-info tw-shrink-0" />}
      <h3 className="tw-text-[13px] tw-font-semibold tw-text-fg-primary tw-m-0">{title}</h3>
    </div>
  );
}

function DocImage({ src, label }) {
  if (!src) {
    return (
      <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-1 tw-h-32 tw-rounded-lg tw-border tw-border-dashed tw-border-tertiary tw-bg-bg-secondary">
        <FileText size={20} className="tw-text-fg-tertiary" />
        <span className="tw-text-[11px] tw-text-fg-tertiary">{label} not uploaded</span>
      </div>
    );
  }
  return (
    <div className="tw-relative tw-group">
      <img
        src={src}
        alt={label}
        className="tw-w-full tw-h-32 tw-object-cover tw-rounded-lg tw-border tw-border-hairline tw-border-tertiary"
      />
      <div className="tw-absolute tw-inset-0 tw-bg-black/40 tw-rounded-lg tw-opacity-0 group-hover:tw-opacity-100 tw-transition-opacity tw-flex tw-items-center tw-justify-center">
        <a href={src} target="_blank" rel="noreferrer" className="tw-text-white tw-text-[11px] tw-font-medium">View full</a>
      </div>
      <span className="tw-text-[10px] tw-text-fg-tertiary tw-mt-1 tw-block tw-text-center">{label}</span>
    </div>
  );
}

function QAItem({ question, answer, index }) {
  const [open, setOpen] = useState(index === 0);
  if (!question) return null;
  return (
    <div className="tw-border tw-border-hairline tw-border-tertiary tw-rounded-lg tw-overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="tw-w-full tw-flex tw-items-center tw-justify-between tw-gap-3 tw-px-4 tw-py-3 tw-bg-bg-secondary hover:tw-bg-bg-primary tw-transition-colors tw-text-left"
      >
        <span className="tw-text-[12px] tw-font-medium tw-text-fg-primary">{question}</span>
        {open ? <ChevronUp size={14} className="tw-text-fg-tertiary tw-shrink-0" /> : <ChevronDown size={14} className="tw-text-fg-tertiary tw-shrink-0" />}
      </button>
      {open && (
        <div className="tw-px-4 tw-py-3 tw-bg-bg-primary tw-border-t tw-border-hairline tw-border-tertiary">
          <p className="tw-text-[12px] tw-text-fg-secondary tw-m-0 tw-leading-relaxed">{answer || 'No answer provided.'}</p>
        </div>
      )}
    </div>
  );
}

/* ─── FORM 1 PANEL — editable profile ──────────────────────────────── */

function Form1Panel({ id, refetchParent }) {
  const { toast } = useToast();
  const { data, isLoading, isError, error, refetch } = useListenerProfileQuery(id);
  const [updateListenerProfile, { isLoading: isUpdating }] = useUpdateListenerProfileMutation();

  const profile     = data?.profile;
  const profileData = profile?.listenerProfileData?.[0];

  const [editMode, setEditMode] = useState(false);
  const [selectedImage, setSelectedImage]       = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [adharFront, setAdharFront] = useState(null);
  const [adharBack, setAdharBack]   = useState(null);
  const [panCard, setPanCard]       = useState(null);

  const [formData, setFormData] = useState({
    fullName: '', email: '', mobile_number: '',
    dob: '', gender: '', age: '',
    availability: '', about: '',
    bank_name: '', account_number: '', ifsc_code: '', upi_id: '',
  });

  const [formDatas, setFormDatas] = useState({ services: [], topics: [], languages: [] });

  const SERVICE_OPTIONS  = ['audioCall', 'videoCall', 'chat', 'email', 'inPerson'];
  const TOPIC_OPTIONS    = ['Loneliness', 'Breakup', 'Career', 'Stress', 'Anxiety'];
  const LANGUAGE_OPTIONS = ['English','Gujarati','Tamil','Telugu','Marwadi','Urdu','Hindi','Punjabi','Haryanvi','Marathi','Bengali','Kannada','Malayalam','Odia','Sindhi'];

  useEffect(() => {
    if (data) {
      setFormData({
        fullName:      profileData?.display_name || profile?.fullName || '',
        email:         profile?.email            || '',
        mobile_number: profile?.mobile_number    || '',
        dob:           profileData?.dob ? profileData.dob.toString().split(/[T ]/)[0].substring(0, 10) : '',
        gender:        profileData?.gender       || '',
        age:           profileData?.age          || '',
        availability:  profileData?.call_availability_duration || '',
        about:         profileData?.about        || '',
        bank_name:     profileData?.bank_name    || '',
        account_number: profileData?.account_number || '',
        ifsc_code:     profileData?.ifsc_code    || '',
        upi_id:        profileData?.upi_id       || '',
      });
      setFormDatas({
        services:  profileData?.service    || [],
        topics:    profileData?.topic      || [],
        languages: profileData?.languages  || [],
      });
      setSelectedImage(profileData?.display_image || profile?.user_image || null);
      setAdharFront(profileData?.adhar_front ? { preview: profileData.adhar_front } : null);
      setAdharBack(profileData?.adhar_back  ? { preview: profileData.adhar_back }  : null);
      setPanCard(profileData?.pancard       ? { preview: profileData.pancard }      : null);
    }
  }, [data]);

  const handleDrop = useCallback((files, setter) => {
    const f = files[0];
    if (f) setter(Object.assign(f, { preview: URL.createObjectURL(f) }));
  }, []);

  const { getRootProps: afFront, getInputProps: afFrontIn } = useDropzone({ onDrop: (f) => handleDrop(f, setAdharFront), accept: { 'image/*': [] } });
  const { getRootProps: afBack,  getInputProps: afBackIn  } = useDropzone({ onDrop: (f) => handleDrop(f, setAdharBack),  accept: { 'image/*': [] } });
  const { getRootProps: afPan,   getInputProps: afPanIn   } = useDropzone({ onDrop: (f) => handleDrop(f, setPanCard),   accept: { 'image/*': [] } });

  const handleInput  = (e) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  const toggleOption = (type, value) => {
    setFormDatas((p) => ({
      ...p,
      [type]: p[type].includes(value) ? p[type].filter((x) => x !== value) : p[type].length < 3 ? [...p[type], value] : p[type],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
    fd.append('id', id);
    fd.append('services',  JSON.stringify(formDatas.services));
    fd.append('topics',    JSON.stringify(formDatas.topics));
    fd.append('languages', JSON.stringify(formDatas.languages));
    if (selectedImageFile) fd.append('displayImage', selectedImageFile, selectedImageFile.name);
    if (adharFront instanceof File) fd.append('adharFront', adharFront);
    if (adharBack  instanceof File) fd.append('adharBack',  adharBack);
    if (panCard    instanceof File) fd.append('pancard',    panCard);
    try {
      await updateListenerProfile(fd).unwrap();
      toast({ title: 'Profile saved', tone: 'success' });
      setEditMode(false);
      refetch();
      refetchParent?.();
    } catch (err) {
      toast({ title: 'Save failed', description: err?.data?.message || 'Please try again.', tone: 'danger' });
    }
  };

  if (isLoading) return <div className="tw-flex tw-justify-center tw-py-16"><Spinner size={24} /></div>;
  if (isError)   return <div className="tw-p-4"><ErrorBanner message={error?.data?.message || error?.message} /></div>;
  if (!profile)  return <EmptyState title="No profile data" description="Form 1 hasn't been submitted yet." />;

  /* read-only view */
  if (!editMode) return (
    <div className="tw-flex tw-flex-col tw-gap-6 tw-p-4 md:tw-p-6">
      {/* Header strip */}
      <div className="tw-flex tw-items-start tw-justify-between tw-gap-4">
        <div className="tw-flex tw-items-center tw-gap-3">
          <Avatar name={formData.fullName} src={selectedImage} size="lg" />
          <div>
            <p className="tw-text-[15px] tw-font-semibold tw-text-fg-primary tw-m-0">{formData.fullName || '—'}</p>
            <p className="tw-text-[12px] tw-text-fg-tertiary tw-m-0">{formData.email}</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>
          <Edit2 size={13} aria-hidden /> Edit profile
        </Button>
      </div>

      {/* Personal */}
      <Card className="tw-p-4 md:tw-p-5">
        <SectionHeading icon={User} title="Personal information" />
        <div className="tw-grid tw-grid-cols-2 sm:tw-grid-cols-3 tw-gap-x-6 tw-gap-y-5">
          <InfoRow label="Full name"     value={formData.fullName} />
          <InfoRow label="Email"         value={formData.email} />
          <InfoRow label="Phone"         value={formData.mobile_number} />
          <InfoRow label="Date of birth" value={formData.dob ? moment(formData.dob).format('DD MMM YYYY') : '—'} />
          <InfoRow label="Gender"        value={formData.gender} />
          <InfoRow label="Age"           value={formData.age} />
          <InfoRow label="Availability"  value={formData.availability} />
        </div>
      </Card>

      {/* Services / topics / languages */}
      <Card className="tw-p-4 md:tw-p-5">
        <SectionHeading icon={Briefcase} title="Expertise" />
        <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-3 tw-gap-6">
          {[['Services', formDatas.services, 'info'], ['Topics', formDatas.topics, 'warning'], ['Languages', formDatas.languages, 'neutral']].map(([label, items, tone]) => (
            <div key={label}>
              <p className="tw-text-[11px] tw-font-medium tw-text-fg-tertiary tw-uppercase tw-tracking-wider tw-mb-2">{label}</p>
              {items.length ? (
                <div className="tw-flex tw-flex-wrap tw-gap-1.5">
                  {items.map((v) => (
                    <span key={v} className="tw-px-2 tw-py-0.5 tw-rounded-full tw-text-[11px] tw-font-medium tw-bg-bg-secondary tw-text-fg-secondary tw-border tw-border-hairline tw-border-tertiary">{v}</span>
                  ))}
                </div>
              ) : <span className="tw-text-[12px] tw-text-fg-tertiary">—</span>}
            </div>
          ))}
        </div>
      </Card>

      {/* About */}
      {formData.about && (
        <Card className="tw-p-4 md:tw-p-5">
          <SectionHeading icon={FileText} title="About" />
          <p className="tw-text-[13px] tw-text-fg-secondary tw-leading-relaxed tw-m-0">{formData.about}</p>
        </Card>
      )}

      {/* Bank details */}
      <Card className="tw-p-4 md:tw-p-5">
        <SectionHeading icon={Building} title="Bank details" />
        <div className="tw-grid tw-grid-cols-2 sm:tw-grid-cols-4 tw-gap-x-6 tw-gap-y-5">
          <InfoRow label="Bank name"       value={formData.bank_name} />
          <InfoRow label="Account number"  value={formData.account_number} />
          <InfoRow label="IFSC code"       value={formData.ifsc_code} />
          <InfoRow label="UPI ID"          value={formData.upi_id} />
        </div>
      </Card>

      {/* KYC documents */}
      <Card className="tw-p-4 md:tw-p-5">
        <SectionHeading icon={CreditCard} title="KYC documents" />
        <div className="tw-grid tw-grid-cols-3 tw-gap-4">
          <DocImage src={adharFront?.preview} label="Aadhaar Front" />
          <DocImage src={adharBack?.preview}  label="Aadhaar Back" />
          <DocImage src={panCard?.preview}    label="PAN Card" />
        </div>
      </Card>
    </div>
  );

  /* edit mode */
  return (
    <form onSubmit={handleSubmit} className="tw-flex tw-flex-col tw-gap-6 tw-p-4 md:tw-p-6">
      {/* Avatar */}
      <div className="tw-flex tw-items-center tw-gap-4">
        <div className="tw-relative">
          <Avatar name={formData.fullName} src={selectedImage} size="lg" />
          <label className="tw-absolute tw-bottom-0 tw-right-0 tw-w-6 tw-h-6 tw-rounded-full tw-bg-fg-info tw-flex tw-items-center tw-justify-center tw-cursor-pointer tw-shadow">
            <Edit2 size={11} className="tw-text-white" />
            <input type="file" accept="image/*" className="tw-hidden" onChange={(e) => {
              const f = e.target.files[0];
              if (f) { setSelectedImage(URL.createObjectURL(f)); setSelectedImageFile(f); }
            }} />
          </label>
        </div>
        <p className="tw-text-[12px] tw-text-fg-tertiary">Click the icon to change profile photo</p>
      </div>

      {/* Personal fields */}
      <Card className="tw-p-4 md:tw-p-5">
        <SectionHeading icon={User} title="Personal information" />
        <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-4">
          {[
            ['Full name',    'fullName',      'text'],
            ['Email',        'email',         'email'],
            ['Phone',        'mobile_number', 'tel'],
            ['Date of birth','dob',           'date'],
            ['Age',          'age',           'number'],
            ['Availability', 'availability',  'text'],
          ].map(([label, name, type]) => (
            <label key={name} className="tw-flex tw-flex-col tw-gap-1">
              <span className="tw-text-[11px] tw-font-medium tw-text-fg-tertiary tw-uppercase tw-tracking-wider">{label}</span>
              <input
                type={type} name={name} value={formData[name]} onChange={handleInput}
                className="tw-h-9 tw-px-3 tw-rounded-md tw-border tw-border-hairline tw-border-tertiary tw-bg-bg-primary tw-text-[13px] tw-text-fg-primary focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-fg-info"
              />
            </label>
          ))}
          <label className="tw-flex tw-flex-col tw-gap-1">
            <span className="tw-text-[11px] tw-font-medium tw-text-fg-tertiary tw-uppercase tw-tracking-wider">Gender</span>
            <select name="gender" value={formData.gender} onChange={handleInput}
              className="tw-h-9 tw-px-3 tw-rounded-md tw-border tw-border-hairline tw-border-tertiary tw-bg-bg-primary tw-text-[13px] tw-text-fg-primary focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-fg-info">
              <option value="">Choose…</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </label>
        </div>
        <label className="tw-flex tw-flex-col tw-gap-1 tw-mt-4">
          <span className="tw-text-[11px] tw-font-medium tw-text-fg-tertiary tw-uppercase tw-tracking-wider">About</span>
          <textarea name="about" value={formData.about} onChange={handleInput} rows={3}
            className="tw-px-3 tw-py-2 tw-rounded-md tw-border tw-border-hairline tw-border-tertiary tw-bg-bg-primary tw-text-[13px] tw-text-fg-primary tw-resize-none focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-fg-info" />
        </label>
      </Card>

      {/* Expertise multi-select */}
      <Card className="tw-p-4 md:tw-p-5">
        <SectionHeading icon={Briefcase} title="Expertise" />
        <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-3 tw-gap-6">
          {[
            ['Services',  'services',  SERVICE_OPTIONS],
            ['Topics',    'topics',    TOPIC_OPTIONS],
            ['Languages', 'languages', LANGUAGE_OPTIONS],
          ].map(([label, key, opts]) => (
            <div key={key}>
              <p className="tw-text-[11px] tw-font-medium tw-text-fg-tertiary tw-uppercase tw-tracking-wider tw-mb-2">{label} <span className="tw-normal-case">(max 3)</span></p>
              <div className="tw-flex tw-flex-wrap tw-gap-1.5 tw-mb-2">
                {formDatas[key].map((v) => (
                  <span key={v} onClick={() => toggleOption(key, v)}
                    className="tw-flex tw-items-center tw-gap-1 tw-px-2 tw-py-0.5 tw-rounded-full tw-text-[11px] tw-font-medium tw-bg-fg-info/10 tw-text-fg-info tw-cursor-pointer hover:tw-bg-fg-info/20 tw-border tw-border-fg-info/20">
                    {v} <X size={9} />
                  </span>
                ))}
              </div>
              <div className="tw-flex tw-flex-wrap tw-gap-1.5">
                {opts.filter((o) => !formDatas[key].includes(o)).map((o) => (
                  <span key={o} onClick={() => toggleOption(key, o)}
                    className="tw-px-2 tw-py-0.5 tw-rounded-full tw-text-[11px] tw-cursor-pointer tw-bg-bg-secondary tw-text-fg-tertiary tw-border tw-border-hairline tw-border-tertiary hover:tw-border-fg-info hover:tw-text-fg-info tw-transition-colors">
                    {o}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Bank details */}
      <Card className="tw-p-4 md:tw-p-5">
        <SectionHeading icon={Building} title="Bank details" />
        <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-4">
          {[
            ['Bank name',      'bank_name',      'text'],
            ['Account number', 'account_number', 'number'],
            ['IFSC code',      'ifsc_code',      'text'],
            ['UPI ID',         'upi_id',         'text'],
          ].map(([label, name, type]) => (
            <label key={name} className="tw-flex tw-flex-col tw-gap-1">
              <span className="tw-text-[11px] tw-font-medium tw-text-fg-tertiary tw-uppercase tw-tracking-wider">{label}</span>
              <input type={type} name={name} value={formData[name]} onChange={handleInput}
                className="tw-h-9 tw-px-3 tw-rounded-md tw-border tw-border-hairline tw-border-tertiary tw-bg-bg-primary tw-text-[13px] tw-text-fg-primary focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-fg-info" />
            </label>
          ))}
        </div>
      </Card>

      {/* KYC dropzones */}
      <Card className="tw-p-4 md:tw-p-5">
        <SectionHeading icon={CreditCard} title="KYC documents" />
        <div className="tw-grid tw-grid-cols-3 tw-gap-4">
          {[
            ['Aadhaar Front', afFront, afFrontIn, adharFront],
            ['Aadhaar Back',  afBack,  afBackIn,  adharBack],
            ['PAN Card',      afPan,   afPanIn,   panCard],
          ].map(([label, getRootProps, getInputProps, file]) => (
            <div key={label} {...getRootProps()} className="tw-cursor-pointer">
              <input {...getInputProps()} />
              {file?.preview ? (
                <div className="tw-relative tw-group">
                  <img src={file.preview} alt={label} className="tw-w-full tw-h-28 tw-object-cover tw-rounded-lg tw-border tw-border-fg-info/40" />
                  <div className="tw-absolute tw-inset-0 tw-bg-black/40 tw-rounded-lg tw-opacity-0 group-hover:tw-opacity-100 tw-flex tw-items-center tw-justify-center tw-text-white tw-text-[11px]">Click to change</div>
                </div>
              ) : (
                <div className="tw-h-28 tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-1 tw-rounded-lg tw-border tw-border-dashed tw-border-tertiary tw-bg-bg-secondary hover:tw-border-fg-info tw-transition-colors">
                  <Download size={16} className="tw-text-fg-tertiary" />
                  <span className="tw-text-[11px] tw-text-fg-tertiary tw-text-center tw-px-2">{label}</span>
                </div>
              )}
              <span className="tw-text-[10px] tw-text-fg-tertiary tw-mt-1 tw-block tw-text-center">{label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Action buttons */}
      <div className="tw-flex tw-items-center tw-gap-3 tw-justify-end">
        <Button variant="ghost" onClick={() => setEditMode(false)}>Cancel</Button>
        <Button type="submit" disabled={isUpdating}>
          {isUpdating ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}

/* ─── FORM 2 PANEL — application docs (read-only) ──────────────────── */

function Form2Panel({ id }) {
  const { data, isLoading, isError, error } = useFormDataQuery({ id });
  const fd = data?.formData;

  if (isLoading) return <div className="tw-flex tw-justify-center tw-py-16"><Spinner size={24} /></div>;
  if (isError)   return <div className="tw-p-4"><ErrorBanner message={error?.data?.message || error?.message} /></div>;
  if (!fd)       return (
    <div className="tw-p-6">
      <EmptyState title="No application submitted" description="Form 2 (application docs) hasn't been submitted yet." />
    </div>
  );

  const qaItems = [
    { q: fd.question1, a: fd.answer1 },
    { q: fd.question2, a: fd.answer2 },
    { q: fd.question3, a: fd.answer3 },
    { q: fd.question4, a: fd.answer4 },
  ].filter((item) => item.q);

  return (
    <div className="tw-flex tw-flex-col tw-gap-6 tw-p-4 md:tw-p-6">
      {/* Personal info as submitted */}
      <Card className="tw-p-4 md:tw-p-5">
        <SectionHeading icon={User} title="Personal information (as submitted)" />
        <div className="tw-grid tw-grid-cols-2 sm:tw-grid-cols-3 tw-gap-x-6 tw-gap-y-5">
          <InfoRow label="Full name"     value={fd.fullName} />
          <InfoRow label="Email"         value={fd.email} />
          <InfoRow label="Phone"         value={fd.mobile_number} />
          <InfoRow label="Gender"        value={fd.gender} />
          <InfoRow label="Date of birth" value={fd.dob ? moment(fd.dob).format('DD MMM YYYY') : '—'} />
          <InfoRow label="Reference"     value={fd.reference} />
        </div>
      </Card>

      {/* Audio */}
      {fd.audio && (
        <Card className="tw-p-4 md:tw-p-5">
          <SectionHeading icon={Music} title="Voice sample" />
          <div className="tw-flex tw-items-center tw-gap-4 tw-flex-wrap">
            <div className="tw-flex-1 tw-min-w-[240px]">
              <ReactAudioPlayer src={fd.audio} />
            </div>
            <a
              href={fd.audio}
              download="voice-sample.webm"
              className="tw-inline-flex tw-items-center tw-gap-1.5 tw-px-3 tw-py-1.5 tw-rounded-md tw-border tw-border-hairline tw-border-tertiary tw-text-[12px] tw-text-fg-secondary hover:tw-bg-bg-secondary tw-transition-colors tw-no-underline"
            >
              <Download size={13} aria-hidden /> Download audio
            </a>
          </div>
        </Card>
      )}

      {/* Resume */}
      {fd.resume && (
        <Card className="tw-p-4 md:tw-p-5">
          <SectionHeading icon={FileText} title="Resume" />
          <div className="tw-flex tw-items-center tw-gap-3 tw-p-3 tw-rounded-lg tw-bg-bg-secondary tw-border tw-border-hairline tw-border-tertiary">
            <div className="tw-w-9 tw-h-9 tw-rounded-lg tw-bg-fg-danger/10 tw-flex tw-items-center tw-justify-center tw-shrink-0">
              <FileText size={16} className="tw-text-fg-danger" />
            </div>
            <div className="tw-flex-1 tw-min-w-0">
              <p className="tw-text-[13px] tw-font-medium tw-text-fg-primary tw-m-0 tw-truncate">
                {fd.resume.split('/').pop().split('.').slice(0, -1).join('.') || `${fd.fullName}-resume`}
              </p>
              <p className="tw-text-[11px] tw-text-fg-tertiary tw-m-0">PDF document</p>
            </div>
            <a
              href={fd.resume}
              download={`${fd.fullName}-resume.pdf`}
              target="_blank" rel="noreferrer"
              className="tw-inline-flex tw-items-center tw-gap-1.5 tw-px-3 tw-py-1.5 tw-rounded-md tw-border tw-border-hairline tw-border-tertiary tw-text-[12px] tw-text-fg-secondary hover:tw-bg-bg-secondary tw-transition-colors tw-no-underline tw-shrink-0"
            >
              <Download size={13} aria-hidden /> Download
            </a>
          </div>
        </Card>
      )}

      {/* Q&A */}
      {qaItems.length > 0 && (
        <Card className="tw-p-4 md:tw-p-5">
          <SectionHeading icon={Hash} title="System questions & answers" />
          <div className="tw-flex tw-flex-col tw-gap-2">
            {qaItems.map((item, i) => (
              <QAItem key={i} question={item.q} answer={item.a} index={i} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ─── MAIN PAGE ─────────────────────────────────────────────────────── */

export default function ApplicationReview() {
  const location = useLocation();
  const navigate  = useNavigate();
  const { toast } = useToast();
  const id = new URLSearchParams(location.search).get('id');

  const [tab, setTab] = useState('form1');
  const [rejectOpen, setRejectOpen]         = useState(false);
  const [linkOpen, setLinkOpen]             = useState(false);
  const [pendingUserId, setPendingUserId]   = useState(null);
  const [pendingUserName, setPendingUserName] = useState(null);
  const [pendingFormStep, setPendingFormStep] = useState(null);

  const [sendForm1, { isLoading: isSending1 }] = useSendOnboardingForm1Mutation();
  const [sendForm2, { isLoading: isSending2 }] = useSendOnboardingForm2Mutation();

  // Get listener name for the header
  const { data: profileData, refetch } = useListenerProfileQuery(id);
  const listenerName = profileData?.profile?.listenerProfileData?.[0]?.display_name
    || profileData?.profile?.fullName || 'Listener';

  const openSend = (step) => {
    setPendingUserId(id);
    setPendingUserName(listenerName);
    setPendingFormStep(step);
    setLinkOpen(true);
  };

  const confirmSend = async () => {
    try {
      if (pendingFormStep === 1) await sendForm1(pendingUserId).unwrap();
      else                       await sendForm2(pendingUserId).unwrap();
      toast({ title: `Form ${pendingFormStep} sent to ${pendingUserName}`, tone: 'success' });
    } catch (err) {
      toast({ title: 'Send failed', description: err?.data?.message || 'Please try again.', tone: 'danger' });
    } finally {
      setPendingUserId(null);
      setPendingUserName(null);
      setPendingFormStep(null);
      setLinkOpen(false);
    }
  };

  if (!id) {
    return (
      <div className="tw-p-8">
        <EmptyState title="No listener selected" description="Open this page from an application request row." />
      </div>
    );
  }

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      <PageHeader
        title={`Application review — ${listenerName}`}
        description="Full view of both forms submitted by this applicant."
        primaryAction={
          <div className="tw-flex tw-items-center tw-gap-2">
            <Button variant="outline" size="sm" onClick={() => openSend(1)}>
              <Send size={13} aria-hidden /> Send Form 1
            </Button>
            <Button size="sm" onClick={() => openSend(2)}>
              <Send size={13} aria-hidden /> Send Form 2
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setRejectOpen(true); }}>
              <X size={13} className="tw-text-fg-danger" aria-hidden /> Reject
            </Button>
          </div>
        }
      />

      {/* Back link */}
      <button
        onClick={() => navigate(-1)}
        className="tw-inline-flex tw-items-center tw-gap-1.5 tw-text-[12px] tw-text-fg-tertiary hover:tw-text-fg-primary tw-transition-colors tw-w-fit"
      >
        <ArrowLeft size={13} /> Back to applications
      </button>

      {/* Tabbed content */}
      <Card flush>
        <Tabs value={tab} onChange={setTab}>
          <TabsList ariaLabel="Application forms">
            <Tab value="form1">
              <span className="tw-flex tw-items-center tw-gap-1.5"><User size={13} /> Form 1 — Listener profile</span>
            </Tab>
            <Tab value="form2">
              <span className="tw-flex tw-items-center tw-gap-1.5"><FileText size={13} /> Form 2 — Application docs</span>
            </Tab>
          </TabsList>
          <TabPanel value="form1">
            <Form1Panel id={id} refetchParent={refetch} />
          </TabPanel>
          <TabPanel value="form2">
            <Form2Panel id={id} />
          </TabPanel>
        </Tabs>
      </Card>

      <RejectionModal
        show={rejectOpen}
        rejectedUser={id}
        refetch={refetch}
        onHide={() => setRejectOpen(false)}
      />
      <LinkShare
        show={linkOpen}
        onHide={() => setLinkOpen(false)}
        onConfirm={confirmSend}
        userId={pendingUserId}
        userName={pendingUserName}
        formStep={pendingFormStep}
        isMutationLoading={isSending1 || isSending2}
      />
    </div>
  );
}
