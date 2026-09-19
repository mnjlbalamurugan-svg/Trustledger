export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Applicant {
  id: string;
  name: string;
  phone: string;
  email: string;
  identity_reference: string;
  created_at: string;
}

export interface ApplicationItem {
  id: string;
  application_number: string;
  applicant_name: string;
  applicant_id: string;
  requested_amount: number;
  loan_purpose: string;
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: string;
  document_status: string;
  kyc_status: string;
  network_flag: string;
  created_at: string;
}

export interface EvidenceModule {
  items: string[];
  confidence?: number;
  status: string;
}

export interface ApplicationDetail {
  id: string;
  application_number: string;
  applicant: Applicant;
  requested_amount: number;
  loan_purpose: string;
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: string;
  document_status: string;
  kyc_status: string;
  network_flag: string;
  created_at: string;
  updated_at: string;
  evidence_summary: {
    document_forensics: EvidenceModule;
    photo_kyc: EvidenceModule;
    fraud_network: EvidenceModule;
    verification_ledger: EvidenceModule;
  };
  explainability: string;
}

export interface DocumentForensics {
  font_consistency: string;
  layout_consistency: string;
  metadata_status: string;
  transaction_formatting: string;
  image_manipulation: string;
  tampering_indicators_count: number;
  confidence: number;
  is_tampered: boolean;
  summary: string;
}

export interface DocumentData {
  id: string;
  application_id: string;
  filename: string;
  document_type: string;
  file_hash: string;
  forensic_result: string;
  confidence: number;
  forensics: DocumentForensics;
  created_at: string;
}

export interface KYCSessionData {
  session_id: string;
  application_id: string;
  application_number: string;
  status: string;
  face_match_score: number;
  liveness_score: number;
  manipulation_score: number;
  images: Record<string, { id: string; hash: string }>;
}

export interface NetworkNode {
  id: string;
  label: string;
  applicant_name: string;
  risk_score: number;
  risk_level: string;
  is_central: boolean;
  status: string;
  loan_amount?: string;
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  relationship: string;
  confidence: number;
}

export interface NetworkGraphData {
  application_id: string;
  application_number: string;
  network_risk: string;
  connected_applications_count: number;
  potential_ring_detected: boolean;
  summary: string;
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  disclaimer: string;
}

export interface LedgerRecord {
  id: string;
  application_id: string;
  application_number?: string;
  artifact_type: string;
  artifact_hash: string;
  previous_hash: string;
  record_hash: string;
  timestamp: string;
  integrity_status: 'VERIFIED' | 'TAMPERED';
  metadata?: Record<string, any>;
}

export interface AlertItem {
  id: string;
  application_id: string;
  application_number: string;
  applicant_name: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  detection_layer: string;
  status: 'ACTIVE' | 'REVIEWED' | 'RESOLVED';
  created_at: string;
  resolved_at?: string;
}

export interface DashboardSummary {
  applications_reviewed: number;
  high_risk_applications: number;
  documents_flagged: number;
  kyc_alerts: number;
  risk_distribution: {
    Low: number;
    Medium: number;
    High: number;
    Critical: number;
  };
}

export interface RiskTrendPoint {
  date: string;
  reviewed: number;
  flagged: number;
  avg_risk: number;
}
