import React, { useEffect, useState } from 'react';
import { Copy, Check, ExternalLink, MessageCircle } from 'lucide-react';

import { Modal, ModalBody, ModalFooter, Button, Textarea, useToast } from '../ui';
import { useOnboardingFormLinkMutation } from '../../../services/listener';

/**
 * OnboardingLinkModal — mints a Form 1 / Form 2 link and hands it to the admin
 * to paste wherever the candidate actually is.
 *
 * Onboarding forms used to go out by email only. Candidates sign up in the app
 * with a mobile number and no email address, so for most of them there was
 * nothing to send to and the action just failed. Copying a link works for
 * everyone.
 *
 * Generating a link retires any earlier unused link for the same step and moves
 * the candidate's status forward, exactly as emailing it used to — so opening
 * this modal is the commitment, not the copy button.
 */

// navigator.clipboard needs a secure context; the panel is HTTPS in every
// deployed environment but not necessarily on a LAN IP during testing.
async function copyText(value) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }

  try {
    const el = document.createElement('textarea');
    el.value = value;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

function CopyButton({ value, label, variant = 'outline', icon = true }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!copied) return undefined;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={async () => {
        const ok = await copyText(value);
        if (ok) {
          setCopied(true);
        } else {
          toast({
            title: 'Could not copy',
            description: 'Select the text and copy it manually.',
            tone: 'danger',
          });
        }
      }}
    >
      {icon && (copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />)}
      {copied ? 'Copied' : label}
    </Button>
  );
}

export default function OnboardingLinkModal({ open, onClose, user, formStep, onIssued }) {
  const [generate, { isLoading }] = useOnboardingFormLinkMutation();
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const userId = user?.id;
  const userName = user?.fullName || 'this candidate';

  useEffect(() => {
    // One mint per opening. Re-generating on every render would invalidate the
    // link the admin is in the middle of pasting.
    if (!open || !userId || !formStep) return;

    let cancelled = false;
    setResult(null);
    setError(null);

    generate({ id: userId, formStep })
      .unwrap()
      .then((res) => {
        if (cancelled) return;
        setResult(res?.data || null);
        onIssued?.();
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.data?.message || 'Could not generate the form link.');
      });

    return () => { cancelled = true; };
    // onIssued is a refetch callback and is intentionally not a dependency —
    // including it would re-mint the token on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId, formStep, generate]);

  const expiry = result?.expiresAt
    ? new Date(result.expiresAt).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : null;

  // wa.me needs a bare international number. Stored numbers are 10-digit
  // Indian mobiles, so prefix 91 when the country code is missing.
  const waNumber = (() => {
    const digits = String(result?.mobile_number || '').replace(/\D/g, '');
    if (!digits) return null;
    return digits.length === 10 ? `91${digits}` : digits;
  })();

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={`Form ${formStep} link for ${userName}`}
      description="Copy this and send it to the candidate on WhatsApp, SMS or email."
    >
      <ModalBody>
        {isLoading && (
          <p className="tw-text-[12px] tw-text-fg-tertiary">Generating link…</p>
        )}

        {error && (
          <p className="tw-text-[12px] tw-text-fg-danger">{error}</p>
        )}

        {result && (
          <div className="tw-flex tw-flex-col tw-gap-4">
            <div className="tw-flex tw-flex-col tw-gap-1.5">
              <div className="tw-flex tw-items-center tw-justify-between tw-gap-2">
                <span className="tw-text-[11px] tw-uppercase tw-tracking-wide tw-text-fg-tertiary">
                  Form link
                </span>
                <CopyButton value={result.url} label="Copy link" />
              </div>
              <code className="tw-block tw-w-full tw-p-2 tw-rounded-md tw-bg-bg-secondary tw-border tw-border-hairline tw-border-tertiary tw-text-[12px] tw-text-fg-primary tw-break-all">
                {result.url}
              </code>
            </div>

            <div className="tw-flex tw-flex-col tw-gap-1.5">
              <div className="tw-flex tw-items-center tw-justify-between tw-gap-2">
                <span className="tw-text-[11px] tw-uppercase tw-tracking-wide tw-text-fg-tertiary">
                  Message
                </span>
                <CopyButton value={result.shareText} label="Copy message" />
              </div>
              {/* Editable so HR can adjust the wording before sending; the copy
                  button above always copies the server text, so edits are for
                  manual selection only. */}
              <Textarea readOnly rows={9} defaultValue={result.shareText} />
            </div>

            <p className="tw-text-[11px] tw-text-fg-tertiary">
              {expiry ? `Valid until ${expiry}. ` : ''}
              Can only be submitted once. Generating a new link cancels this one.
            </p>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        {result && waNumber && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              window.open(
                `https://wa.me/${waNumber}?text=${encodeURIComponent(result.shareText)}`,
                '_blank',
                'noopener,noreferrer',
              )
            }
          >
            <MessageCircle size={14} aria-hidden /> Open in WhatsApp
          </Button>
        )}
        {result && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(result.url, '_blank', 'noopener,noreferrer')}
          >
            <ExternalLink size={14} aria-hidden /> Preview form
          </Button>
        )}
        <Button size="sm" onClick={onClose}>Done</Button>
      </ModalFooter>
    </Modal>
  );
}
