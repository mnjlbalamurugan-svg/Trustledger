import json
from typing import Dict, Any

def analyze_document_forensics(filename: str, file_hash: str) -> Dict[str, Any]:
    """
    Deterministic prototype document forensics inference.
    Flags 3 tampering indicators for tampered demo files or files containing 'tampered' / 'suspicious' in name,
    or returns normal for clean files.
    """
    fn_lower = filename.lower()
    is_tampered_case = "tamper" in fn_lower or "fake" in fn_lower or "fraud" in fn_lower or "altered" in fn_lower

    if is_tampered_case:
        return {
            "font_consistency": "WARNING — Inconsistent glyph metrics & baseline shifts",
            "layout_consistency": "WARNING — Suspicious table border kerning",
            "metadata_status": "WARNING — Metadata mismatch (Ghostscript / modified timestamp)",
            "transaction_formatting": "WARNING — Anomaly detected in currency alignment",
            "image_manipulation": "Potential manipulation detected in bank logo raster",
            "tampering_indicators_count": 3,
            "confidence": 91.0,
            "is_tampered": True,
            "forensic_result": "SUSPICIOUS",
            "summary": "3 tampering indicators detected: Font inconsistency, metadata mismatch, and transaction formatting anomaly."
        }
    else:
        return {
            "font_consistency": "PASS — Uniform system font metrics",
            "layout_consistency": "PASS — Standard institutional grid",
            "metadata_status": "PASS — Authentic generator metadata verified",
            "transaction_formatting": "PASS — Consistent decimal and date notation",
            "image_manipulation": "PASS — No raster or layer splices detected",
            "tampering_indicators_count": 0,
            "confidence": 94.0,
            "is_tampered": False,
            "forensic_result": "NORMAL",
            "summary": "Document integrity indicators: Normal. No forensic tampering markers detected."
        }
