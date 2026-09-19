import React, { useState } from 'react';
import { X, Plus, ShieldCheck, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { api } from '../../services/api';

interface NewApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplicationCreated: (app: any) => void;
}

export const NewApplicationModal: React.FC<NewApplicationModalProps> = ({
  isOpen,
  onClose,
  onApplicationCreated,
}) => {
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pan, setPan] = useState('');
  const [idRef, setIdRef] = useState('');
  const [address, setAddress] = useState('');
  const [employmentType, setEmploymentType] = useState('Salaried');
  const [monthlyIncome, setMonthlyIncome] = useState('75000');
  const [bankAccount, setBankAccount] = useState('');
  const [orgName, setOrgName] = useState('');
  const [amount, setAmount] = useState('500000');
  const [loanPurpose, setLoanPurpose] = useState('SME Working Capital');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        applicant_name: name.trim(),
        dob: dob || undefined,
        phone: phone.trim(),
        email: email.trim(),
        pan: pan.trim() || undefined,
        identity_reference: idRef.trim(),
        address: address.trim() || undefined,
        employment_type: employmentType,
        monthly_income: parseFloat(monthlyIncome) || 0,
        bank_account: bankAccount.trim() || undefined,
        organization_name: orgName.trim() || undefined,
        application_amount: parseFloat(amount) || 500000,
        loan_purpose: loanPurpose.trim()
      };

      const newApp = await api.createApplication(payload);
      onApplicationCreated(newApp);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-charcoal-900 border border-plum-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-5 border-b border-plum-border bg-plum-950 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-plum-800 border border-violet-electric/40 flex items-center justify-center text-violet-electric">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Add New Lending Application</h3>
              <p className="text-xs text-slate-400">Enter applicant underwriting information to begin forensic verification.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-plum-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="m-5 mb-0 p-3 bg-coral-subtle border border-coral-vibrant/30 rounded-lg flex items-center space-x-2 text-xs text-coral-dark">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Applicant Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Chandra"
                className="w-full px-3 py-2 rounded-lg bg-charcoal-850 border border-charcoal-border text-white focus:outline-none focus:border-violet-electric"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-charcoal-850 border border-charcoal-border text-white focus:outline-none focus:border-violet-electric"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 rounded-lg bg-charcoal-850 border border-charcoal-border text-white focus:outline-none focus:border-violet-electric"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ramesh@company.in"
                className="w-full px-3 py-2 rounded-lg bg-charcoal-850 border border-charcoal-border text-white focus:outline-none focus:border-violet-electric"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                PAN Number
              </label>
              <input
                type="text"
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                placeholder="ABCDE1234F"
                className="w-full px-3 py-2 rounded-lg bg-charcoal-850 border border-charcoal-border text-white font-mono focus:outline-none focus:border-violet-electric"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Identity Reference (Aadhaar / National ID) *
              </label>
              <input
                type="text"
                required
                value={idRef}
                onChange={(e) => setIdRef(e.target.value)}
                placeholder="XXXX-XXXX-8921"
                className="w-full px-3 py-2 rounded-lg bg-charcoal-850 border border-charcoal-border text-white font-mono focus:outline-none focus:border-violet-electric"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Residential Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Suite 402, Prestige Tower, Bangalore"
              className="w-full px-3 py-2 rounded-lg bg-charcoal-850 border border-charcoal-border text-white focus:outline-none focus:border-violet-electric"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Employment Type
              </label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-charcoal-850 border border-charcoal-border text-white focus:outline-none focus:border-violet-electric"
              >
                <option value="Salaried">Salaried</option>
                <option value="Self-Employed">Self-Employed</option>
                <option value="Business Owner">Business Owner</option>
                <option value="Contractor">Contractor</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Monthly Income (₹)
              </label>
              <input
                type="number"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                placeholder="85000"
                className="w-full px-3 py-2 rounded-lg bg-charcoal-850 border border-charcoal-border text-white font-mono focus:outline-none focus:border-violet-electric"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Disbursement Bank A/C
              </label>
              <input
                type="text"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="HDFC 501004928192"
                className="w-full px-3 py-2 rounded-lg bg-charcoal-850 border border-charcoal-border text-white font-mono focus:outline-none focus:border-violet-electric"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Application Amount (₹) *
              </label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="500000"
                className="w-full px-3 py-2 rounded-lg bg-charcoal-850 border border-charcoal-border text-white font-mono focus:outline-none focus:border-violet-electric"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Loan Purpose *
              </label>
              <input
                type="text"
                required
                value={loanPurpose}
                onChange={(e) => setLoanPurpose(e.target.value)}
                placeholder="Working Capital Expansion"
                className="w-full px-3 py-2 rounded-lg bg-charcoal-850 border border-charcoal-border text-white focus:outline-none focus:border-violet-electric"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-plum-border flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              SHA-256 genesis block will be minted into verification ledger immediately.
            </span>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-charcoal-800 text-slate-300 hover:bg-charcoal-750 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-plum-700 to-coral-vibrant hover:from-plum-600 hover:to-coral-dark text-white font-bold flex items-center space-x-1.5 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>{loading ? 'Creating...' : 'Create Application'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
