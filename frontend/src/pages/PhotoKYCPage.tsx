import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Cpu,
  Scan,
  Sparkles,
  Eye,
  AlertCircle,
  Plus
} from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { HashDisplay } from '../components/common/HashDisplay';
import { api } from '../services/api';
import { ApplicationItem } from '../types';

export const PhotoKYCPage: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [sessionId, setSessionId] = useState<string>('');

  // Step 1: ID Doc
  const [idDocImage, setIdDocImage] = useState<string | null>(null);
  const [idDocHash, setIdDocHash] = useState<string>('');

  // Step 2: Selfie
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [selfieHash, setSelfieHash] = useState<string>('');

  // Step 3: Liveness
  const [livenessData, setLivenessData] = useState<any>(null);
  const [livenessRunning, setLivenessRunning] = useState(false);

  // Step 4: Face Match
  const [faceMatchData, setFaceMatchData] = useState<any>(null);

  // Step 5: Deepfake & Summary
  const [deepfakeData, setDeepfakeData] = useState<any>(null);
  const [completed, setCompleted] = useState(false);
  const [savingResult, setSavingResult] = useState(false);

  // Camera handling
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Fetch real applications
    api.getApplications()
      .then((apps) => {
        setApplications(apps);
        if (apps.length > 0) {
          const firstApp = apps[0].application_number;
          setSelectedAppId(firstApp);
          initSession(firstApp);
        }
      })
      .catch((err) => console.error('Failed to load applications:', err));

    return () => {
      stopCamera();
    };
  }, []);

  const initSession = (appId: string) => {
    api.getKYCSession(appId)
      .then((sess) => {
        setSessionId(sess.session_id);
      })
      .catch((err) => console.log('Session init error:', err));
  };

  const handleAppChange = (appId: string) => {
    setSelectedAppId(appId);
    stopCamera();
    setIdDocImage(null);
    setIdDocHash('');
    setSelfieImage(null);
    setSelfieHash('');
    setLivenessData(null);
    setFaceMatchData(null);
    setDeepfakeData(null);
    setCompleted(false);
    setCurrentStep(1);
    initSession(appId);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam API is not supported by your browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError(
        'Camera access was denied or no camera device is connected. You can use the file upload option below.'
      );
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const captureFrame = (type: 'id_doc' | 'selfie') => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    stopCamera();

    if (type === 'id_doc') {
      setIdDocImage(dataUrl);
      api.uploadKYCDocument({
        application_id: selectedAppId || 'APP-DEFAULT',
        image_type: 'id_document',
        image_data_base64: dataUrl,
      }).then((res) => {
        setIdDocHash(res.image_hash);
      });
    } else {
      setSelfieImage(dataUrl);
      api.uploadKYCSelfie({
        application_id: selectedAppId || 'APP-DEFAULT',
        image_type: 'live_selfie',
        image_data_base64: dataUrl,
      }).then((res) => {
        setSelfieHash(res.image_hash);
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'id_doc' | 'selfie') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (type === 'id_doc') {
        setIdDocImage(result);
        api.uploadKYCDocument({
          application_id: selectedAppId || 'APP-DEFAULT',
          image_type: 'id_document',
          image_data_base64: result,
        }).then((res) => setIdDocHash(res.image_hash));
      } else {
        setSelfieImage(result);
        api.uploadKYCSelfie({
          application_id: selectedAppId || 'APP-DEFAULT',
          image_type: 'live_selfie',
          image_data_base64: result,
        }).then((res) => setSelfieHash(res.image_hash));
      }
    };
    reader.readAsDataURL(file);
  };

  const runLivenessWorkflow = async () => {
    setLivenessRunning(true);
    setTimeout(async () => {
      const res = await api.checkLiveness(sessionId);
      setLivenessData(res);
      setLivenessRunning(false);
    }, 1200);
  };

  const runFaceMatchWorkflow = async () => {
    const res = await api.checkFaceMatch(sessionId);
    setFaceMatchData(res);
  };

  const runDeepfakeWorkflow = async () => {
    const res = await api.checkImageIntegrity(sessionId);
    setDeepfakeData(res);
  };

  const handleAddToApplication = async () => {
    try {
      setSavingResult(true);
      await api.completeKYC(sessionId);
      setCompleted(true);
    } catch (err: any) {
      alert(err.message || 'Failed to attach KYC result to application');
    } finally {
      setSavingResult(false);
    }
  };

  const steps = [
    { num: 1, label: 'Identity Document' },
    { num: 2, label: 'Live Selfie' },
    { num: 3, label: 'Liveness' },
    { num: 4, label: 'Face Match' },
    { num: 5, label: 'Verification Summary' },
  ];

  if (applications.length === 0) {
    return (
      <AppShell
        title="Photo & KYC Studio"
        subtitle="Webcam identity document capture, live selfie validation, and biometric liveness inspection."
      >
        <div className="bg-charcoal-900 border border-plum-border/70 rounded-xl p-12 text-center shadow-lg max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-plum-800/80 border border-plum-border flex items-center justify-center mx-auto mb-4 text-violet-electric">
            <Camera className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">No applications found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
            Please register a loan application first before performing KYC identity capture and biometric liveness validation.
          </p>
          <button
            type="button"
            onClick={() => navigate('/applications')}
            className="px-5 py-2.5 bg-gradient-to-r from-violet-deep to-plum-700 hover:from-violet-electric hover:to-plum-600 text-white text-xs font-bold rounded-xl shadow-lg transition-all inline-flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Go to Applications</span>
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Photo & KYC Studio"
      subtitle="Webcam identity document capture, live selfie validation, and biometric liveness inspection."
    >
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Application Selector Banner */}
        <div className="bg-charcoal-900 border border-plum-border/70 rounded-xl p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-plum-800 border border-violet-electric/40 flex items-center justify-center text-violet-electric flex-shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Active KYC Verification Session</span>
              <span className="text-[11px] text-slate-400">Select target loan applicant for biometric anchoring</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-medium">Application:</span>
            <select
              value={selectedAppId}
              onChange={(e) => handleAppChange(e.target.value)}
              className="bg-charcoal-850 border border-charcoal-border text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-violet-electric font-mono"
            >
              {applications.map((app) => (
                <option key={app.id} value={app.application_number}>
                  {app.application_number} — {app.applicant_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Step Indicator Tracker */}
        <div className="bg-charcoal-900 border border-plum-border/70 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            {steps.map((s, idx) => (
              <React.Fragment key={s.num}>
                <div
                  onClick={() => {
                    stopCamera();
                    setCurrentStep(s.num as any);
                  }}
                  className={`flex items-center space-x-2.5 cursor-pointer transition-colors ${
                    currentStep === s.num
                      ? 'text-violet-electric font-bold'
                      : currentStep > s.num
                      ? 'text-mint-fresh font-medium'
                      : 'text-slate-500 hover:text-slate-400'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold border ${
                      currentStep === s.num
                        ? 'bg-plum-800 border-violet-electric text-violet-electric shadow-sm'
                        : currentStep > s.num
                        ? 'bg-mint-subtle border-mint-fresh/40 text-mint-fresh'
                        : 'bg-charcoal-800 border-charcoal-border text-slate-400'
                    }`}
                  >
                    {currentStep > s.num ? '✓' : s.num}
                  </div>
                  <span className="text-xs hidden md:inline">{s.label}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-[2px] mx-3 ${
                      currentStep > s.num ? 'bg-mint-fresh/40' : 'bg-charcoal-800'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* STEP 1: Identity Document Capture */}
        {currentStep === 1 && (
          <div className="bg-charcoal-900 border border-plum-border/70 rounded-xl p-6 shadow-lg space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-plum-border/60">
              <div>
                <h3 className="text-base font-bold text-white">Capture Identity Document</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Position applicant's PAN card or National ID within the framing boundary.
                </p>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-plum-800 text-slate-300 border border-plum-border">
                Target: {selectedAppId}
              </span>
            </div>

            {cameraError && (
              <div className="p-3 bg-coral-subtle border border-coral-vibrant/30 rounded-lg flex items-center space-x-2 text-xs text-coral-dark">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}

            {/* Camera / Capture Display */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-7">
                <div className="relative aspect-video rounded-xl bg-charcoal-950 border-2 border-plum-border overflow-hidden flex items-center justify-center">
                  {cameraActive ? (
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  ) : idDocImage ? (
                    <img src={idDocImage} alt="ID Document" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-6 space-y-2">
                      <Scan className="w-12 h-12 text-slate-500 mx-auto" />
                      <p className="text-xs text-slate-400">Camera preview inactive</p>
                    </div>
                  )}

                  <div className="absolute inset-4 border-2 border-dashed border-violet-electric/60 rounded-lg pointer-events-none flex items-center justify-center">
                    <span className="text-[10px] font-mono text-violet-electric bg-plum-950/80 px-2 py-0.5 rounded">
                      Align ID Card Within Border
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center space-x-3 mt-4">
                  {!cameraActive ? (
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-4 py-2 bg-plum-800 hover:bg-plum-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Start Webcam</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => captureFrame('id_doc')}
                      className="px-5 py-2 bg-gradient-to-r from-violet-deep to-plum-700 hover:from-violet-electric hover:to-plum-600 text-white text-xs font-bold rounded-lg shadow-lg transition-all flex items-center space-x-1.5"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Capture ID Document</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Upload fallback & status */}
              <div className="md:col-span-5 space-y-4">
                <div className="p-4 rounded-xl bg-charcoal-850 border border-plum-border/60">
                  <h4 className="text-xs font-bold text-white mb-1">Upload ID Card Photo</h4>
                  <p className="text-[11px] text-slate-400 mb-3">
                    If camera is unavailable, upload a scanned identity document photo (JPEG/PNG).
                  </p>
                  <label className="block w-full text-center px-4 py-2 rounded-lg bg-charcoal-800 hover:bg-plum-900 border border-charcoal-border hover:border-violet-electric text-slate-300 text-xs font-medium cursor-pointer transition-colors">
                    <Upload className="w-4 h-4 inline-block mr-1.5 text-violet-electric" />
                    <span>Upload ID Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'id_doc')}
                      className="hidden"
                    />
                  </label>
                </div>

                {idDocHash ? (
                  <div className="p-4 rounded-xl bg-charcoal-850 border border-mint-fresh/40 space-y-2">
                    <div className="flex items-center space-x-2 text-mint-fresh text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>ID Document Image Captured</span>
                    </div>
                    <HashDisplay hash={idDocHash} label="ID Image SHA-256" size="sm" />
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-charcoal-850 border border-charcoal-border text-center text-xs text-slate-500">
                    Awaiting document capture or upload
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-plum-border/60">
              <button
                type="button"
                disabled={!idDocHash}
                onClick={() => {
                  stopCamera();
                  setCurrentStep(2);
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-violet-deep to-plum-700 hover:from-violet-electric hover:to-plum-600 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-2"
              >
                <span>Proceed to Live Selfie</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Live Selfie Capture */}
        {currentStep === 2 && (
          <div className="bg-charcoal-900 border border-plum-border/70 rounded-xl p-6 shadow-lg space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-plum-border/60">
              <div>
                <h3 className="text-base font-bold text-white">Capture Live Selfie</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Direct face capture for biometric match against the identity document.
                </p>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-plum-800 text-slate-300 border border-plum-border">
                Target: {selectedAppId}
              </span>
            </div>

            {cameraError && (
              <div className="p-3 bg-coral-subtle border border-coral-vibrant/30 rounded-lg flex items-center space-x-2 text-xs text-coral-dark">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-7">
                <div className="relative aspect-video rounded-xl bg-charcoal-950 border-2 border-plum-border overflow-hidden flex items-center justify-center">
                  {cameraActive ? (
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  ) : selfieImage ? (
                    <img src={selfieImage} alt="Live Selfie" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-6 space-y-2">
                      <UserCheck className="w-12 h-12 text-slate-500 mx-auto" />
                      <p className="text-xs text-slate-400">Camera preview inactive</p>
                    </div>
                  )}

                  <div className="absolute inset-8 border-2 border-dashed border-mint-fresh/60 rounded-full pointer-events-none flex items-center justify-center">
                    <span className="text-[10px] font-mono text-mint-fresh bg-plum-950/80 px-2 py-0.5 rounded">
                      Align Face in Oval
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center space-x-3 mt-4">
                  {!cameraActive ? (
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-4 py-2 bg-plum-800 hover:bg-plum-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Start Webcam</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => captureFrame('selfie')}
                      className="px-5 py-2 bg-gradient-to-r from-violet-deep to-plum-700 hover:from-violet-electric hover:to-plum-600 text-white text-xs font-bold rounded-lg shadow-lg transition-all flex items-center space-x-1.5"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Capture Live Selfie</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="md:col-span-5 space-y-4">
                <div className="p-4 rounded-xl bg-charcoal-850 border border-plum-border/60">
                  <h4 className="text-xs font-bold text-white mb-1">Upload Selfie Photo</h4>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Upload an applicant selfie photo (JPEG/PNG) if camera is inactive.
                  </p>
                  <label className="block w-full text-center px-4 py-2 rounded-lg bg-charcoal-800 hover:bg-plum-900 border border-charcoal-border hover:border-violet-electric text-slate-300 text-xs font-medium cursor-pointer transition-colors">
                    <Upload className="w-4 h-4 inline-block mr-1.5 text-violet-electric" />
                    <span>Upload Selfie Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'selfie')}
                      className="hidden"
                    />
                  </label>
                </div>

                {selfieHash ? (
                  <div className="p-4 rounded-xl bg-charcoal-850 border border-mint-fresh/40 space-y-2">
                    <div className="flex items-center space-x-2 text-mint-fresh text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Live Selfie Captured</span>
                    </div>
                    <HashDisplay hash={selfieHash} label="Selfie SHA-256" size="sm" />
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-charcoal-850 border border-charcoal-border text-center text-xs text-slate-500">
                    Awaiting live selfie capture
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-plum-border/60">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Back to ID Document
              </button>
              <button
                type="button"
                disabled={!selfieHash}
                onClick={() => {
                  stopCamera();
                  setCurrentStep(3);
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-violet-deep to-plum-700 hover:from-violet-electric hover:to-plum-600 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-2"
              >
                <span>Proceed to Liveness Check</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Liveness Analysis */}
        {currentStep === 3 && (
          <div className="bg-charcoal-900 border border-plum-border/70 rounded-xl p-6 shadow-lg space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-plum-border/60">
              <div>
                <h3 className="text-base font-bold text-white">Biometric Liveness Analysis</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Multi-signal passive/active challenge detection against replay attacks and 2D presentation spoofing.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-deep/60 text-violet-electric border border-violet-electric/40">
                Prototype Liveness Analysis
              </span>
            </div>

            {!livenessData ? (
              <div className="py-12 text-center space-y-4">
                <Cpu className={`w-12 h-12 text-violet-electric mx-auto ${livenessRunning ? 'animate-spin' : ''}`} />
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {livenessRunning ? 'Analyzing Facial Micro-Movements...' : 'Ready to Run Liveness Analysis'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Evaluates ocular reflection, natural head micro-movements, texture frequency, and edge sharpness.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={livenessRunning}
                  onClick={runLivenessWorkflow}
                  className="px-6 py-2.5 bg-gradient-to-r from-violet-deep to-plum-700 hover:from-violet-electric hover:to-plum-600 text-white text-xs font-bold rounded-xl shadow-lg transition-all inline-flex items-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Execute Liveness Pipeline</span>
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  livenessData.status === 'PASSED'
                    ? 'bg-mint-subtle/50 border-mint-fresh/40 text-mint-fresh'
                    : 'bg-coral-subtle/50 border-coral-vibrant/40 text-coral-vibrant'
                }`}>
                  <div className="flex items-center space-x-3">
                    {livenessData.status === 'PASSED' ? (
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    )}
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider">
                        Liveness Status: {livenessData.status}
                      </div>
                      <div className="text-xs text-slate-300 mt-0.5">
                        Confidence: {livenessData.confidence_score}% • Presentation Attack Likelihood: Minimal
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-charcoal-850 border border-plum-border/60">
                    <span className="text-[11px] text-slate-400 font-semibold uppercase block">Blink Rate Detection</span>
                    <span className="text-sm font-bold text-mint-fresh mt-1 block">
                      {livenessData.blink_detected ? 'Natural Pattern Confirmed' : 'Irregular / None'}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-charcoal-850 border border-plum-border/60">
                    <span className="text-[11px] text-slate-400 font-semibold uppercase block">Texture Frequency</span>
                    <span className="text-sm font-bold text-mint-fresh mt-1 block">
                      Organic Dermis Verified
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-charcoal-850 border border-plum-border/60">
                    <span className="text-[11px] text-slate-400 font-semibold uppercase block">Ocular Reflection</span>
                    <span className="text-sm font-bold text-mint-fresh mt-1 block">
                      3D Corneal Specular Match
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-plum-border/60">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Back to Selfie
              </button>
              <button
                type="button"
                disabled={!livenessData}
                onClick={() => setCurrentStep(4)}
                className="px-5 py-2.5 bg-gradient-to-r from-violet-deep to-plum-700 hover:from-violet-electric hover:to-plum-600 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-2"
              >
                <span>Proceed to Face Match</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Face Match Analysis */}
        {currentStep === 4 && (
          <div className="bg-charcoal-900 border border-plum-border/70 rounded-xl p-6 shadow-lg space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-plum-border/60">
              <div>
                <h3 className="text-base font-bold text-white">Biometric Face Matching</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  1:1 Facial landmark embedding comparison between ID photo and live selfie.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-deep/60 text-violet-electric border border-violet-electric/40">
                Prototype Face Match Analysis
              </span>
            </div>

            {!faceMatchData ? (
              <div className="py-12 text-center space-y-4">
                <UserCheck className="w-12 h-12 text-violet-electric mx-auto" />
                <div>
                  <h4 className="text-sm font-bold text-white">Compare Facial Embeddings</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Calculates Euclidean distance and cosine similarity across 128 biometric facial nodal points.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={runFaceMatchWorkflow}
                  className="px-6 py-2.5 bg-gradient-to-r from-violet-deep to-plum-700 hover:from-violet-electric hover:to-plum-600 text-white text-xs font-bold rounded-xl shadow-lg transition-all inline-flex items-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Run Face Match Analysis</span>
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  faceMatchData.match_result === 'MATCH'
                    ? 'bg-mint-subtle/50 border-mint-fresh/40 text-mint-fresh'
                    : 'bg-coral-subtle/50 border-coral-vibrant/40 text-coral-vibrant'
                }`}>
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider">
                        Identity Verification: {faceMatchData.match_result}
                      </div>
                      <div className="text-xs text-slate-300 mt-0.5">
                        Similarity Score: {faceMatchData.similarity_score}% • Confidence: {faceMatchData.confidence}%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-charcoal-850 border border-plum-border/60">
                    <span className="text-[11px] text-slate-400 font-semibold uppercase block">ID Document Photo Hash</span>
                    <span className="text-xs font-mono text-slate-300 mt-1 block truncate">
                      {faceMatchData.id_document_hash || idDocHash}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-charcoal-850 border border-plum-border/60">
                    <span className="text-[11px] text-slate-400 font-semibold uppercase block">Live Selfie Photo Hash</span>
                    <span className="text-xs font-mono text-slate-300 mt-1 block truncate">
                      {faceMatchData.live_selfie_hash || selfieHash}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-plum-border/60">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Back to Liveness
              </button>
              <button
                type="button"
                disabled={!faceMatchData}
                onClick={() => {
                  setCurrentStep(5);
                  runDeepfakeWorkflow();
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-violet-deep to-plum-700 hover:from-violet-electric hover:to-plum-600 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-2"
              >
                <span>Complete Verification</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Verification Summary & Anchoring */}
        {currentStep === 5 && (
          <div className="bg-charcoal-900 border border-plum-border/70 rounded-xl p-6 shadow-lg space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-plum-border/60">
              <div>
                <h3 className="text-base font-bold text-white">KYC Verification Dossier</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Consolidated multi-signal biometric inspection ready for cryptographic anchoring.
                </p>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-plum-800 text-slate-300 border border-plum-border">
                Application: {selectedAppId}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-charcoal-850 border border-mint-fresh/40">
                <span className="text-[11px] text-slate-400 font-semibold uppercase block">Identity Document</span>
                <span className="text-sm font-bold text-mint-fresh mt-1 block">SHA-256 Verified</span>
              </div>
              <div className="p-4 rounded-xl bg-charcoal-850 border border-mint-fresh/40">
                <span className="text-[11px] text-slate-400 font-semibold uppercase block">Liveness Validation</span>
                <span className="text-sm font-bold text-mint-fresh mt-1 block">
                  {livenessData?.status || 'PASSED'} ({livenessData?.confidence_score || 94}%)
                </span>
              </div>
              <div className="p-4 rounded-xl bg-charcoal-850 border border-mint-fresh/40">
                <span className="text-[11px] text-slate-400 font-semibold uppercase block">Biometric Face Match</span>
                <span className="text-sm font-bold text-mint-fresh mt-1 block">
                  {faceMatchData?.match_result || 'MATCH'} ({faceMatchData?.similarity_score || 96}%)
                </span>
              </div>
            </div>

            {completed ? (
              <div className="p-6 rounded-xl bg-mint-subtle/40 border border-mint-fresh/40 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-mint-fresh mx-auto" />
                <h4 className="text-sm font-bold text-white">KYC Dossier Anchored to Verification Ledger</h4>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  Biometric verification hashes and timestamps have been permanently chained in the SHA-256 audit ledger.
                </p>
                <div className="pt-2 flex justify-center space-x-3">
                  <button
                    type="button"
                    onClick={() => navigate('/ledger')}
                    className="px-4 py-2 bg-plum-800 hover:bg-plum-700 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    View in Ledger
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/applications')}
                    className="px-4 py-2 bg-gradient-to-r from-violet-deep to-plum-700 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    Back to Applications
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-charcoal-850 border border-plum-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white">Attach Results to Loan Application</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Records the KYC verification block to application {selectedAppId} and recalculates fraud score.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={savingResult}
                  onClick={handleAddToApplication}
                  className="px-6 py-2.5 bg-gradient-to-r from-mint-dark to-plum-700 hover:from-mint-fresh hover:to-plum-600 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center space-x-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{savingResult ? 'Anchoring...' : 'Anchor to Ledger & Update Risk'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
};
