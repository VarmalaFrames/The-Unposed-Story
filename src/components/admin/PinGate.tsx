import React, { useState } from 'react';
import { StorageService } from '../../services/storage';
import { Lock, KeyRound, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';

interface PinGateProps {
  onSuccess: () => void;
  onBackToSite: () => void;
}

export const PinGate: React.FC<PinGateProps> = ({ onSuccess, onBackToSite }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [changeSuccess, setChangeSuccess] = useState(false);

  const existingPin = StorageService.getPin() || '1234';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pin.trim() === existingPin) {
      onSuccess();
    } else {
      setError('Incorrect Studio PIN.');
    }
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (currentPinInput !== existingPin) {
      setError('Current PIN does not match.');
      return;
    }
    if (newPinInput.length < 4) {
      setError('New PIN must be at least 4 characters long.');
      return;
    }
    if (newPinInput !== confirmPinInput) {
      setError('New PIN and confirmation do not match.');
      return;
    }

    StorageService.savePin(newPinInput);
    setChangeSuccess(true);
    setTimeout(() => {
      setIsChangingPin(false);
      setChangeSuccess(false);
      setCurrentPinInput('');
      setNewPinInput('');
      setConfirmPinInput('');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center p-6 text-gray-900">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 p-8 sm:p-10 shadow-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Studio Management</h1>
          <p className="text-[11px] uppercase tracking-widest text-gray-400 mt-1.5 font-bold">
            The Unposed Story
          </p>
        </div>

        {isChangingPin ? (
          /* Change PIN Form */
          <form onSubmit={handleChangePin} className="space-y-4">
            <div className="text-xs text-gray-500 mb-2 font-normal">
              Update your Studio access PIN below.
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                Current PIN
              </label>
              <input
                type="password"
                required
                value={currentPinInput}
                onChange={(e) => setCurrentPinInput(e.target.value)}
                placeholder="Current PIN"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                New PIN (min 4 chars)
              </label>
              <input
                type="password"
                required
                value={newPinInput}
                onChange={(e) => setNewPinInput(e.target.value)}
                placeholder="New PIN"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                Confirm New PIN
              </label>
              <input
                type="password"
                required
                value={confirmPinInput}
                onChange={(e) => setConfirmPinInput(e.target.value)}
                placeholder="Confirm New PIN"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {changeSuccess && (
              <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>PIN updated successfully!</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-full bg-black text-white text-xs uppercase tracking-widest font-bold hover:bg-gray-800 transition-colors shadow-sm cursor-pointer"
            >
              Save New PIN
            </button>

            <button
              type="button"
              onClick={() => {
                setIsChangingPin(false);
                setError(null);
              }}
              className="w-full py-2 text-xs uppercase tracking-widest font-bold text-gray-500 hover:text-black cursor-pointer"
            >
              Cancel
            </button>
          </form>
        ) : (
          /* Login Form */
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2 font-bold text-center">
                Enter Studio PIN
              </label>
              <input
                type="password"
                required
                autoFocus
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-center text-xl tracking-[0.3em] focus:outline-none focus:border-black font-mono shadow-2xs"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              id="admin-login-submit-btn"
              className="w-full py-3.5 rounded-full bg-black text-white text-xs uppercase tracking-widest font-bold hover:bg-gray-800 transition-colors shadow-md cursor-pointer"
            >
              Unlock Dashboard
            </button>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-center text-xs text-gray-500">
              <button
                type="button"
                onClick={() => setIsChangingPin(true)}
                className="hover:text-black flex items-center gap-1.5 transition-colors font-medium cursor-pointer text-gray-400 hover:text-gray-900 text-xs"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Change PIN</span>
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <button
            onClick={onBackToSite}
            id="admin-back-to-site-btn"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500 hover:text-black transition-colors font-bold cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Live Site</span>
          </button>
        </div>
      </div>
    </div>
  );
};
