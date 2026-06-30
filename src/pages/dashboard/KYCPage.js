import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import accountService from '../../services/accountService';
import Navbar from '../../components/common/Navbar';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Alert from '../../components/common/Alert';
import { formatDate, KYC_STATUS } from '../../utils/constants';

const DOCUMENT_TYPES = [
  { value: 'passport', label: 'Passport' },
  { value: 'national_id', label: 'National ID' },
  { value: 'driver_license', label: "Driver's License" },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

export default function KYCPage() {
  const { user } = useAuth();
  const [kycStatus, setKycStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [documentType, setDocumentType] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [frontPreview, setFrontPreview] = useState(null);
  const [backPreview, setBackPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Rejection details
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittedDocType, setSubmittedDocType] = useState('');

  // Drag and drop
  const [frontDragOver, setFrontDragOver] = useState(false);
  const [backDragOver, setBackDragOver] = useState(false);
  const frontInputRef = useRef(null);
  const backInputRef = useRef(null);

  const fetchKYCStatus = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await accountService.getKYCStatus();
      const status = data?.kyc_status || data?.kyc?.status || user?.kyc_status || 'not_submitted';
      setKycStatus(status);
      if (data?.kyc?.rejection_reason || data?.rejection_reason) {
        setRejectionReason(data.kyc.rejection_reason || data.rejection_reason);
      }
      if (data?.kyc?.document_type || data?.document_type) {
        setSubmittedDocType(data.kyc.document_type || data.document_type);
      }
    } catch (err) {
      // If profile fails, try to use user context data
      setKycStatus(user?.kyc_status || 'not_submitted');
    } finally {
      setLoading(false);
    }
  }, [user?.kyc_status]);

  useEffect(() => {
    fetchKYCStatus();
  }, [fetchKYCStatus]);

  // File handlers
  const handleFileSelect = (file, type) => {
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setFormErrors((prev) => ({
        ...prev,
        [type]: 'Invalid file type. Only JPG, PNG, and PDF are allowed.',
      }));
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFormErrors((prev) => ({
        ...prev,
        [type]: 'File size exceeds 10MB limit.',
      }));
      return;
    }

    setFormErrors((prev) => ({ ...prev, [type]: '' }));

    if (type === 'front') {
      setFrontFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setFrontPreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setFrontPreview(null);
      }
    } else {
      setBackFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setBackPreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setBackPreview(null);
      }
    }
  };

  const handleDrop = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'front') setFrontDragOver(false);
    else setBackDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file, type);
  };

  const handleDragOver = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'front') setFrontDragOver(true);
    else setBackDragOver(true);
  };

  const handleDragLeave = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'front') setFrontDragOver(false);
    else setBackDragOver(false);
  };

  const validateForm = () => {
    const errors = {};
    if (!documentType) errors.documentType = 'Please select a document type';
    if (!documentNumber.trim()) errors.documentNumber = 'Document number is required';
    if (!frontFile) errors.front = 'Front image is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('document_type', documentType);
      formData.append('document_number', documentNumber);
      formData.append('front_image', frontFile);
      if (backFile) formData.append('back_image', backFile);

      await accountService.uploadKYC(formData);
      setSuccess('Documents submitted successfully! Your verification is now pending.');
      setKycStatus('pending');
      // Clear form
      setDocumentType('');
      setDocumentNumber('');
      setFrontFile(null);
      setBackFile(null);
      setFrontPreview(null);
      setBackPreview(null);
      setTimeout(() => setSuccess(''), 6000);
    } catch (err) {
      const msg = err?.response?.data?.detail
        || err?.response?.data?.error
        || err?.response?.data?.message
        || err?.message
        || 'Failed to submit documents';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResubmit = () => {
    setKycStatus('not_submitted');
    setRejectionReason('');
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={styles.page}>
          <div style={styles.loadingContainer}>
            <LoadingSpinner size="lg" text="Checking verification status..." />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div style={styles.page}>
        <div style={styles.container}>
          <h1 style={styles.pageTitle}>Identity Verification</h1>
          <p style={styles.pageDescription}>
            Complete your KYC verification to unlock full banking features.
          </p>

          {/* Alerts */}
          {error && (
            <div style={{ marginBottom: '24px' }}>
              <Alert type="error" message={error} onClose={() => setError('')} />
            </div>
          )}
          {success && (
            <div style={{ marginBottom: '24px' }}>
              <Alert type="success" message={success} onClose={() => setSuccess('')} />
            </div>
          )}

          {/* === APPROVED STATE === */}
          {kycStatus === 'approved' && (
            <div style={styles.statusCard}>
              <div style={styles.approvedHeader}>
                <div style={styles.approvedIconContainer}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div>
                  <h2 style={styles.approvedTitle}>Your Identity Has Been Verified</h2>
                  <p style={styles.approvedSubtitle}>All banking features are now available to you.</p>
                </div>
              </div>

              <div style={styles.verifiedBadge}>
                <span style={{ fontSize: '20px', marginRight: '8px' }}>✅</span>
                <span style={styles.verifiedBadgeText}>Verified Account</span>
              </div>

              {submittedDocType && (
                <div style={styles.docDetails}>
                  <div style={styles.docRow}>
                    <span style={styles.docLabel}>Document Type</span>
                    <span style={styles.docValue}>
                      {DOCUMENT_TYPES.find((d) => d.value === submittedDocType)?.label || submittedDocType}
                    </span>
                  </div>
                  {documentNumber && (
                    <div style={styles.docRow}>
                      <span style={styles.docLabel}>Document Number</span>
                      <span style={styles.docValue}>••••••••{documentNumber.slice(-4)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* === PENDING STATE === */}
          {kycStatus === 'pending' && (
            <div style={styles.statusCard}>
              <div style={styles.pendingHeader}>
                <div style={styles.pendingIconContainer}>
                  <div style={styles.pendingSpinner} />
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative', zIndex: 1 }}>
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div>
                  <h2 style={styles.pendingTitle}>Your Documents Are Under Review</h2>
                  <p style={styles.pendingSubtitle}>This usually takes 1-3 business days.</p>
                </div>
              </div>

              <div style={styles.pendingTimeline}>
                <div style={styles.timelineStep}>
                  <div style={styles.timelineDotCompleted} />
                  <div>
                    <span style={styles.timelineText}>Documents submitted</span>
                  </div>
                </div>
                <div style={styles.timelineLine} />
                <div style={styles.timelineStep}>
                  <div style={styles.timelineDotActive} />
                  <div>
                    <span style={styles.timelineTextActive}>Under review</span>
                  </div>
                </div>
                <div style={styles.timelineLine} />
                <div style={styles.timelineStep}>
                  <div style={styles.timelineDotPending} />
                  <div>
                    <span style={styles.timelineText}>Verification complete</span>
                  </div>
                </div>
              </div>

              {submittedDocType && (
                <div style={styles.submittedInfo}>
                  <span style={styles.submittedLabel}>Submitted Document:</span>
                  <span style={styles.submittedValue}>
                    {DOCUMENT_TYPES.find((d) => d.value === submittedDocType)?.label || submittedDocType}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* === REJECTED STATE === */}
          {kycStatus === 'rejected' && (
            <div style={styles.statusCard}>
              <div style={styles.rejectedHeader}>
                <div style={styles.rejectedIconContainer}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </div>
                <div>
                  <h2 style={styles.rejectedTitle}>Verification Was Unsuccessful</h2>
                  <p style={styles.rejectedSubtitle}>Please review the reason below and resubmit your documents.</p>
                </div>
              </div>

              {rejectionReason && (
                <div style={styles.rejectionBox}>
                  <span style={styles.rejectionLabel}>Rejection Reason:</span>
                  <p style={styles.rejectionText}>{rejectionReason}</p>
                </div>
              )}

              {submittedDocType && (
                <div style={styles.submittedInfo}>
                  <span style={styles.submittedLabel}>Document Type:</span>
                  <span style={styles.submittedValue}>
                    {DOCUMENT_TYPES.find((d) => d.value === submittedDocType)?.label || submittedDocType}
                  </span>
                </div>
              )}

              <div style={{ marginTop: '24px' }}>
                <Button onClick={handleResubmit} variant="primary">
                  Resubmit Documents
                </Button>
              </div>
            </div>
          )}

          {/* === NOT SUBMITTED STATE === */}
          {kycStatus === 'not_submitted' && (
            <>
              {/* Info Card */}
              <div style={styles.infoCard}>
                <h3 style={styles.infoTitle}>Why Do We Need Your ID?</h3>
                <p style={styles.infoText}>
                  To comply with financial regulations and ensure the security of your account,
                  we need to verify your identity. This is a one-time process that unlocks
                  all banking features including higher transfer limits.
                </p>
                <div style={styles.benefitsGrid}>
                  <div style={styles.benefit}>
                    <span style={styles.benefitIcon}>🔒</span>
                    <div>
                      <span style={styles.benefitTitle}>Enhanced Security</span>
                      <p style={styles.benefitDesc}>Protect your account from unauthorized access</p>
                    </div>
                  </div>
                  <div style={styles.benefit}>
                    <span style={styles.benefitIcon}>💰</span>
                    <div>
                      <span style={styles.benefitTitle}>Higher Limits</span>
                      <p style={styles.benefitDesc}>Increased transfer and withdrawal limits</p>
                    </div>
                  </div>
                  <div style={styles.benefit}>
                    <span style={styles.benefitIcon}>⚡</span>
                    <div>
                      <span style={styles.benefitTitle}>Full Access</span>
                      <p style={styles.benefitDesc}>Access all banking features and services</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Form */}
              <div style={styles.formCard}>
                <h3 style={styles.formTitle}>Upload Your Documents</h3>

                {/* Document Type */}
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>
                    Document Type <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    value={documentType}
                    onChange={(e) => {
                      setDocumentType(e.target.value);
                      setFormErrors((prev) => ({ ...prev, documentType: '' }));
                    }}
                    style={{
                      ...styles.selectInput,
                      borderColor: formErrors.documentType ? '#dc2626' : '#e5e7eb',
                    }}
                  >
                    <option value="">Select document type</option>
                    {DOCUMENT_TYPES.map((dt) => (
                      <option key={dt.value} value={dt.value}>{dt.label}</option>
                    ))}
                  </select>
                  {formErrors.documentType && (
                    <span style={styles.errorText}>{formErrors.documentType}</span>
                  )}
                </div>

                {/* Document Number */}
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>
                    Document Number <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={documentNumber}
                    onChange={(e) => {
                      setDocumentNumber(e.target.value);
                      setFormErrors((prev) => ({ ...prev, documentNumber: '' }));
                    }}
                    placeholder="Enter your document number"
                    style={{
                      ...styles.textInput,
                      borderColor: formErrors.documentNumber ? '#dc2626' : '#e5e7eb',
                    }}
                  />
                  {formErrors.documentNumber && (
                    <span style={styles.errorText}>{formErrors.documentNumber}</span>
                  )}
                </div>

                {/* Front Image Upload */}
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>
                    Front Image <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <div
                    onDrop={(e) => handleDrop(e, 'front')}
                    onDragOver={(e) => handleDragOver(e, 'front')}
                    onDragLeave={(e) => handleDragLeave(e, 'front')}
                    onClick={() => frontInputRef.current?.click()}
                    style={{
                      ...styles.dropZone,
                      borderColor: frontDragOver ? '#1a56db' : frontPreview ? '#a7f3d0' : formErrors.front ? '#dc2626' : '#e5e7eb',
                      backgroundColor: frontDragOver ? '#eff6ff' : frontPreview ? '#ecfdf5' : '#f9fafb',
                    }}
                  >
                    <input
                      ref={frontInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => handleFileSelect(e.target.files[0], 'front')}
                      style={{ display: 'none' }}
                    />
                    {frontPreview ? (
                      <div style={styles.previewContainer}>
                        <img src={frontPreview} alt="Front document" style={styles.previewImage} />
                        <span style={styles.previewLabel}>Click to change</span>
                      </div>
                    ) : frontFile ? (
                      <div style={styles.previewContainer}>
                        <span style={{ fontSize: '32px' }}>📄</span>
                        <span style={styles.previewLabel}>{frontFile.name}</span>
                      </div>
                    ) : (
                      <div style={styles.dropZoneContent}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        <p style={styles.dropText}>
                          <span style={{ color: '#1a56db', fontWeight: 600 }}>Click to upload</span> or drag and drop
                        </p>
                        <p style={styles.dropHint}>JPG, PNG, or PDF (max. 10MB)</p>
                      </div>
                    )}
                  </div>
                  {formErrors.front && (
                    <span style={styles.errorText}>{formErrors.front}</span>
                  )}
                </div>

                {/* Back Image Upload */}
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>
                    Back Image <span style={{ color: '#6b7280', fontWeight: 400 }}>(Optional)</span>
                  </label>
                  <div
                    onDrop={(e) => handleDrop(e, 'back')}
                    onDragOver={(e) => handleDragOver(e, 'back')}
                    onDragLeave={(e) => handleDragLeave(e, 'back')}
                    onClick={() => backInputRef.current?.click()}
                    style={{
                      ...styles.dropZone,
                      borderColor: backDragOver ? '#1a56db' : backPreview ? '#a7f3d0' : formErrors.back ? '#dc2626' : '#e5e7eb',
                      backgroundColor: backDragOver ? '#eff6ff' : backPreview ? '#ecfdf5' : '#f9fafb',
                    }}
                  >
                    <input
                      ref={backInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => handleFileSelect(e.target.files[0], 'back')}
                      style={{ display: 'none' }}
                    />
                    {backPreview ? (
                      <div style={styles.previewContainer}>
                        <img src={backPreview} alt="Back document" style={styles.previewImage} />
                        <span style={styles.previewLabel}>Click to change</span>
                      </div>
                    ) : backFile ? (
                      <div style={styles.previewContainer}>
                        <span style={{ fontSize: '32px' }}>📄</span>
                        <span style={styles.previewLabel}>{backFile.name}</span>
                      </div>
                    ) : (
                      <div style={styles.dropZoneContent}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        <p style={styles.dropText}>
                          <span style={{ color: '#1a56db', fontWeight: 600 }}>Click to upload</span> or drag and drop
                        </p>
                        <p style={styles.dropHint}>JPG, PNG, or PDF (max. 10MB)</p>
                      </div>
                    )}
                  </div>
                  {formErrors.back && (
                    <span style={styles.errorText}>{formErrors.back}</span>
                  )}
                </div>

                {/* Terms */}
                <div style={styles.termsBox}>
                  <p style={styles.termsText}>
                    By submitting your documents, you confirm that the information provided is accurate
                    and you agree to CrestPoint Credit's <span style={{ color: '#1a56db', fontWeight: 500 }}>Terms of Service</span> and
                    <span style={{ color: '#1a56db', fontWeight: 500 }}> Privacy Policy</span>. Your documents
                    will be processed securely and stored in compliance with applicable data protection laws.
                  </p>
                </div>

                {/* Submit */}
                <Button
                  onClick={handleSubmit}
                  loading={submitting}
                  fullWidth
                  size="lg"
                >
                  Submit for Verification
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Animation style */}
      <style>{`
        @keyframes lc-pendingPulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.3); opacity: 0; }
        }
        @keyframes lc-pendingSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

const styles = {
  page: {
    paddingTop: '64px',
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    fontFamily: 'Inter, -apple-system, sans-serif',
  },
  container: {
    maxWidth: '720px',
    margin: '0 auto',
    padding: '32px 24px',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 64px)',
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#111827',
    margin: '0 0 8px 0',
  },
  pageDescription: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 24px 0',
  },
  // Status cards
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    padding: '32px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  // Approved
  approvedHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
  },
  approvedIconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#ecfdf5',
    flexShrink: 0,
  },
  approvedTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#059669',
    margin: '0 0 4px 0',
  },
  approvedSubtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  verifiedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 20px',
    borderRadius: '100px',
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    marginBottom: '24px',
  },
  verifiedBadgeText: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#059669',
  },
  docDetails: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '16px',
  },
  docRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
  },
  docLabel: {
    fontSize: '13px',
    color: '#6b7280',
  },
  docValue: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#111827',
    textTransform: 'capitalize',
  },
  // Pending
  pendingHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
  },
  pendingIconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#fffbeb',
    flexShrink: 0,
  },
  pendingSpinner: {
    position: 'absolute',
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    border: '3px solid #fef3c7',
    borderTopColor: '#d97706',
    animation: 'lc-pendingSpin 1.5s linear infinite',
  },
  pendingTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#d97706',
    margin: '0 0 4px 0',
  },
  pendingSubtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  pendingTimeline: {
    display: 'flex',
    alignItems: 'center',
    gap: '0',
    marginBottom: '24px',
    padding: '16px 0',
  },
  timelineStep: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  timelineDotCompleted: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#059669',
    border: '2px solid #a7f3d0',
  },
  timelineDotActive: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#d97706',
    border: '2px solid #fde68a',
    boxShadow: '0 0 0 4px #fef3c7',
  },
  timelineDotPending: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#e5e7eb',
    border: '2px solid #f3f4f6',
  },
  timelineText: {
    fontSize: '11px',
    color: '#9ca3af',
  },
  timelineTextActive: {
    fontSize: '11px',
    color: '#d97706',
    fontWeight: 600,
  },
  timelineLine: {
    flex: 1,
    height: '2px',
    backgroundColor: '#e5e7eb',
    margin: '0 8px',
    marginBottom: '24px',
  },
  submittedInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  submittedLabel: {
    fontSize: '13px',
    color: '#6b7280',
  },
  submittedValue: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#111827',
    textTransform: 'capitalize',
  },
  // Rejected
  rejectedHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
  },
  rejectedIconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#fef2f2',
    flexShrink: 0,
  },
  rejectedTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#dc2626',
    margin: '0 0 4px 0',
  },
  rejectedSubtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  rejectionBox: {
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
    border: '1px solid #fecaca',
    padding: '16px',
    marginBottom: '16px',
  },
  rejectionLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#dc2626',
    display: 'block',
    marginBottom: '4px',
  },
  rejectionText: {
    fontSize: '14px',
    color: '#374151',
    margin: 0,
    lineHeight: '20px',
  },
  // Info card
  infoCard: {
    backgroundColor: '#eff6ff',
    borderRadius: '12px',
    border: '1px solid #bfdbfe',
    padding: '24px',
    marginBottom: '24px',
  },
  infoTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1a56db',
    margin: '0 0 8px 0',
  },
  infoText: {
    fontSize: '14px',
    color: '#374151',
    margin: '0 0 20px 0',
    lineHeight: '20px',
  },
  benefitsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  benefit: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  benefitIcon: {
    fontSize: '20px',
    flexShrink: 0,
  },
  benefitTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#111827',
    display: 'block',
  },
  benefitDesc: {
    fontSize: '12px',
    color: '#6b7280',
    margin: '2px 0 0 0',
  },
  // Form
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    padding: '28px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#111827',
    margin: 0,
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#111827',
  },
  selectInput: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    lineHeight: '20px',
    color: '#111827',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    fontFamily: 'Inter, -apple-system, sans-serif',
    cursor: 'pointer',
    transition: 'border-color 0.15s',
  },
  textInput: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    lineHeight: '20px',
    color: '#111827',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    fontFamily: 'Inter, -apple-system, sans-serif',
    transition: 'border-color 0.15s',
  },
  errorText: {
    fontSize: '12px',
    color: '#dc2626',
    lineHeight: '16px',
  },
  // Drop zone
  dropZone: {
    border: '2px dashed',
    borderRadius: '12px',
    padding: '32px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  dropZoneContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  dropText: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  dropHint: {
    fontSize: '12px',
    color: '#9ca3af',
    margin: 0,
  },
  previewContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  previewImage: {
    maxWidth: '200px',
    maxHeight: '140px',
    borderRadius: '8px',
    objectFit: 'contain',
    border: '1px solid #e5e7eb',
  },
  previewLabel: {
    fontSize: '12px',
    color: '#6b7280',
  },
  // Terms
  termsBox: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '16px',
  },
  termsText: {
    fontSize: '12px',
    color: '#6b7280',
    margin: 0,
    lineHeight: '18px',
  },
};
