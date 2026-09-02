import React, { useState } from 'react';
import { SiteSettings, PhotoItem } from '../../types';
import { StorageService } from '../../services/storage';
import { extractDriveFileId, extractDriveFolderId, convertDriveToDirectImageUrl, isDriveUrl } from '../../utils/driveHelper';
import { HardDrive, ExternalLink, Check, Copy, Sparkles, FolderSync, Info, Plus } from 'lucide-react';

interface DriveManagerProps {
  settings: SiteSettings;
  photos?: PhotoItem[];
  onSettingsUpdated: (settings: SiteSettings) => void;
  onPhotosUpdated?: (photos: PhotoItem[]) => void;
}

export const DriveManager: React.FC<DriveManagerProps> = ({
  settings,
  photos = [],
  onSettingsUpdated,
  onPhotosUpdated,
}) => {
  // Drive Link & Settings State
  const [driveFolderUrl, setDriveFolderUrl] = useState(
    settings.driveFolderUrl || 'https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ_example'
  );
  const [driveFolderTitle, setDriveFolderTitle] = useState(
    settings.driveFolderTitle || 'Client High-Res Vault & Drive Archives'
  );
  const [clientId, setClientId] = useState(settings.driveClientId || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Drive Photo Link Tester / Quick Converter State
  const [testDriveLink, setTestDriveLink] = useState('');
  const [convertedUrl, setConvertedUrl] = useState('');
  const [testError, setTestError] = useState<string | null>(null);
  const [testSuccess, setTestSuccess] = useState<string | null>(null);
  const [addingToPortfolio, setAddingToPortfolio] = useState(false);

  // Save Settings
  const handleSaveDriveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const folderId = extractDriveFolderId(driveFolderUrl) || null;
    const updated: SiteSettings = {
      ...settings,
      driveFolderUrl: driveFolderUrl.trim(),
      driveFolderTitle: driveFolderTitle.trim(),
      driveFolderId: folderId,
      driveClientId: clientId.trim(),
    };
    StorageService.saveSettings(updated);
    onSettingsUpdated(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Convert Single Drive Link
  const handleConvertDriveLink = () => {
    setTestError(null);
    setTestSuccess(null);
    setConvertedUrl('');

    if (!testDriveLink.trim()) {
      setTestError('Please paste a Google Drive file link');
      return;
    }

    const fileId = extractDriveFileId(testDriveLink);
    if (!fileId) {
      // Check if it's already a direct link
      if (testDriveLink.startsWith('http')) {
        setConvertedUrl(testDriveLink.trim());
        setTestSuccess('Direct URL recognized.');
        return;
      }
      setTestError('Could not find a valid Google Drive file ID. Please ensure the link is in the format: https://drive.google.com/file/d/FILE_ID/view');
      return;
    }

    const directImg = convertDriveToDirectImageUrl(testDriveLink);
    setConvertedUrl(directImg);
    setTestSuccess(`Successfully converted File ID: ${fileId}`);
  };

  // Direct Add from Converter to Portfolio
  const handleAddConvertedToPortfolio = () => {
    if (!convertedUrl) return;
    setAddingToPortfolio(true);

    const newPhoto: PhotoItem = {
      id: 'photo_drive_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      image: convertedUrl,
      caption: 'Imported from Google Drive',
      moment: 'Wedding Ceremony',
      coupleName: 'Real Wedding',
      date: new Date().toISOString().split('T')[0],
      featured: true,
      createdAt: Date.now(),
    };

    const currentPhotos = photos.length > 0 ? photos : StorageService.getPhotos();
    const updated = [newPhoto, ...currentPhotos];
    StorageService.savePhotos(updated);
    if (onPhotosUpdated) {
      onPhotosUpdated(updated);
    }

    setTestSuccess('Added to public portfolio gallery!');
    setTimeout(() => {
      setAddingToPortfolio(false);
      setTestDriveLink('');
      setConvertedUrl('');
    }, 1800);
  };

  const detectedFolderId = extractDriveFolderId(driveFolderUrl);

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2.5">
          <HardDrive className="w-7 h-7 text-black" />
          <span>Google Drive Integration</span>
        </h2>
        <p className="text-xs text-gray-500 mt-1 font-normal">
          Change and manage your studio Google Drive folder link, export client delivery vaults, and convert Drive photo links into direct web images.
        </p>
      </div>

      {/* Main Drive Link Settings Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-6 shadow-2xs">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <FolderSync className="w-4 h-4 text-emerald-500" />
              <span>Studio Master Google Drive Link</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Set the main Google Drive folder where your high-resolution wedding galleries and archives reside.
            </p>
          </div>

          {driveFolderUrl && driveFolderUrl.startsWith('http') && (
            <a
              href={driveFolderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-gray-200 hover:border-black text-[11px] uppercase tracking-widest font-bold text-gray-800 transition-colors shadow-2xs"
            >
              <span>Test Open Drive</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        <form onSubmit={handleSaveDriveSettings} className="space-y-5">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
              Google Drive Folder / Gallery URL *
            </label>
            <div className="relative">
              <input
                type="url"
                required
                value={driveFolderUrl}
                onChange={(e) => setDriveFolderUrl(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/YOUR_FOLDER_ID"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black font-mono text-xs pr-10"
              />
            </div>
            {detectedFolderId && (
              <p className="text-[11px] text-emerald-600 font-mono mt-1 font-semibold">
                ✓ Valid Drive Folder ID detected: {detectedFolderId}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                Drive Link Display Label
              </label>
              <input
                type="text"
                value={driveFolderTitle}
                onChange={(e) => setDriveFolderTitle(e.target.value)}
                placeholder="e.g. Master High-Res Wedding Archives"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                Optional Google OAuth Client ID
              </label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="e.g. 123456789-abcdef.apps.googleusercontent.com"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black font-mono text-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              id="save-drive-link-btn"
              className="px-6 py-2.5 rounded-full bg-black text-white text-xs uppercase tracking-widest font-bold hover:bg-gray-800 transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Drive Link Updated!</span>
                </>
              ) : (
                <span>Save Drive Settings</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Google Drive Direct Photo Link Converter */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-6 shadow-2xs">
        <div className="pb-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>Google Drive Photo Link Converter</span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5 font-normal">
            Paste any public Google Drive photograph share link to instantly test image rendering and directly add it to your website portfolio.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
              Paste Google Drive Photo Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={testDriveLink}
                onChange={(e) => setTestDriveLink(e.target.value)}
                placeholder="https://drive.google.com/file/d/1A2b3C.../view?usp=sharing"
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black font-mono text-xs"
              />
              <button
                type="button"
                onClick={handleConvertDriveLink}
                className="px-5 py-2.5 rounded-xl bg-black text-white text-xs uppercase tracking-widest font-bold hover:bg-gray-800 transition-colors shrink-0 cursor-pointer"
              >
                Convert &amp; Test
              </button>
            </div>
          </div>

          {testError && (
            <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
              {testError}
            </p>
          )}

          {testSuccess && (
            <p className="text-xs text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200 font-semibold flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>{testSuccess}</span>
            </p>
          )}

          {convertedUrl && (
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={convertedUrl}
                    alt="Drive Preview"
                    className="w-20 h-20 object-cover rounded-xl border border-gray-200 shadow-2xs bg-white"
                    onError={() => {
                      setTestError('Failed to load image preview. Please make sure Google Drive file sharing is set to "Anyone with the link can view".');
                    }}
                  />
                  <div>
                    <p className="text-xs font-bold text-gray-900">Direct Web Image Ready</p>
                    <p className="text-[11px] text-gray-500 font-mono break-all max-w-sm">
                      {convertedUrl}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(convertedUrl);
                      alert('Direct image URL copied to clipboard!');
                    }}
                    className="px-3.5 py-2 rounded-full border border-gray-200 bg-white hover:border-black text-xs font-bold text-gray-700 hover:text-black flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy URL</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddConvertedToPortfolio}
                    disabled={addingToPortfolio}
                    className="px-4 py-2 rounded-full bg-black text-white hover:bg-gray-800 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{addingToPortfolio ? 'Adding...' : 'Add to Portfolio'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Guide Note on Drive Sharing */}
      <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-900">
          <Info className="w-4 h-4 text-black" />
          <span>Important Tip for Google Drive Image Sharing</span>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed font-normal">
          In Google Drive, right-click your photo or folder → click <strong>Share</strong> → change General Access from <em>Restricted</em> to <strong>"Anyone with the link can view"</strong>. This enables seamless, instantaneous rendering on your live website portfolio without requiring visitors to log in.
        </p>
      </div>
    </div>
  );
};
