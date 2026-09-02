import React, { useState } from 'react';
import { InquiryItem, SiteSettings } from '../../types';
import { StorageService } from '../../services/storage';
import {
  Mail,
  Phone,
  Calendar,
  Clock,
  Trash2,
  CheckCircle,
  Circle,
  MessageSquare,
  X,
  Send,
  Zap,
  ExternalLink,
  Eye,
  FileText,
} from 'lucide-react';

interface InquiryManagerProps {
  inquiries: InquiryItem[];
  onInquiriesUpdated: (inquiries: InquiryItem[]) => void;
  settings?: SiteSettings;
}

export const InquiryManager: React.FC<InquiryManagerProps> = ({
  inquiries,
  onInquiriesUpdated,
  settings: propSettings,
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [inquiryNotice, setInquiryNotice] = useState<string | null>(null);
  const [previewAutoReplyInquiry, setPreviewAutoReplyInquiry] = useState<InquiryItem | null>(null);

  const activeSettings = propSettings || StorageService.getSettings();

  const handleToggleRead = (id: string) => {
    const updated = inquiries.map((i) => (i.id === id ? { ...i, read: !i.read } : i));
    StorageService.saveInquiries(updated);
    onInquiriesUpdated(updated);
  };

  const handleDelete = (id: string) => {
    const updated = inquiries.filter((i) => i.id !== id);
    StorageService.saveInquiries(updated);
    onInquiriesUpdated(updated);
    setConfirmDeleteId(null);
    setInquiryNotice('Inquiry removed.');
    setTimeout(() => setInquiryNotice(null), 3000);
  };

  const handleMarkAutoReplied = (id: string) => {
    const updated = inquiries.map((i) =>
      i.id === id
        ? {
            ...i,
            autoReplied: true,
            autoReplySentAt: Date.now(),
            read: true,
          }
        : i
    );
    StorageService.saveInquiries(updated);
    onInquiriesUpdated(updated);
    setInquiryNotice('Marked as auto-replied.');
    setTimeout(() => setInquiryNotice(null), 2500);
  };

  const unreadCount = inquiries.filter((i) => !i.read).length;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Notice */}
      {inquiryNotice && (
        <div className="p-3.5 rounded-xl bg-black text-white text-xs font-semibold flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{inquiryNotice}</span>
          </div>
          <button onClick={() => setInquiryNotice(null)} className="text-gray-400 hover:text-white cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Client Inquiries ({inquiries.length})
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] uppercase tracking-wider font-bold">
              <Zap className="w-3 h-3 text-amber-500" />
              Auto-Reply Active
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1 font-normal">
            Messages and booking requests sent via your website contact form.
          </p>
        </div>

        {unreadCount > 0 && (
          <span className="px-3.5 py-1 rounded-full bg-emerald-500 text-white text-[10px] uppercase tracking-widest font-extrabold shadow-2xs">
            {unreadCount} Unread
          </span>
        )}
      </div>

      {inquiries.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
          <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-3 opacity-50" />
          <p className="text-sm font-semibold text-gray-600">No inquiries yet.</p>
          <p className="text-xs text-gray-400 mt-1">
            When visitors submit your contact form, their details and auto-reply dispatch status will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inq) => {
            const isDeleting = confirmDeleteId === inq.id;
            const autoReplyUrls = StorageService.generateAutoReplyText(inq, activeSettings);
            const cleanPhone = (inq.phone || '').replace(/[^0-9+]/g, '');

            return (
              <div
                key={inq.id}
                className={`p-6 sm:p-7 bg-white rounded-2xl border transition-all ${
                  inq.read
                    ? 'border-gray-200 opacity-90'
                    : 'border-l-4 border-l-black border-gray-200 shadow-sm'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                        {inq.name}
                      </h3>
                      {!inq.read && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" title="Unread" />
                      )}
                      {inq.autoReplied && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>Auto-Replied</span>
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1 font-medium">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-gray-400" />
                        {inq.email}
                      </span>
                      {inq.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-500" />
                          {inq.phone}
                        </span>
                      )}
                      {inq.weddingDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {inq.weddingDate}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-gray-400 shrink-0 font-medium">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(inq.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>

                {/* Message Body */}
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4 font-normal">
                  {inq.message}
                </p>

                {/* Quick Auto-Reply Actions */}
                <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Auto-Reply Email */}
                    <a
                      href={autoReplyUrls.mailToUrl}
                      onClick={() => handleMarkAutoReplied(inq.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-black text-white text-xs uppercase tracking-wider font-bold hover:bg-gray-800 transition-colors shadow-2xs"
                    >
                      <Mail className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Send Auto-Reply Email</span>
                    </a>

                    {/* WhatsApp Quick Dispatch */}
                    {cleanPhone && (
                      <a
                        href={autoReplyUrls.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleMarkAutoReplied(inq.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-emerald-600 text-white text-xs uppercase tracking-wider font-bold hover:bg-emerald-700 transition-colors shadow-2xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Instant WhatsApp Reply</span>
                      </a>
                    )}

                    {/* Preview Auto Reply */}
                    <button
                      type="button"
                      onClick={() => setPreviewAutoReplyInquiry(inq)}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-gray-600" />
                      <span>Preview Auto-Reply</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleRead(inq.id)}
                      className="text-xs text-gray-500 hover:text-black flex items-center gap-1 transition-colors cursor-pointer font-medium"
                    >
                      {inq.read ? (
                        <>
                          <Circle className="w-3.5 h-3.5" />
                          <span>Mark as Unread</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Mark as Read</span>
                        </>
                      )}
                    </button>

                    {isDeleting ? (
                      <div className="flex items-center gap-1 bg-red-50 p-1 rounded-xl border border-red-200">
                        <button
                          onClick={() => handleDelete(inq.id)}
                          className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[10px] uppercase tracking-wider font-extrabold cursor-pointer"
                        >
                          Confirm Delete
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="p-1 rounded-lg text-gray-500 hover:text-black cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(inq.id)}
                        title="Delete Inquiry"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Auto-Reply Preview Modal */}
      {previewAutoReplyInquiry && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <h3 className="text-base font-bold text-gray-900">
                  Auto-Reply Preview for {previewAutoReplyInquiry.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewAutoReplyInquiry(null)}
                className="p-1.5 text-gray-400 hover:text-black rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-2">
              <div>
                <strong className="text-gray-500 block uppercase text-[10px] tracking-wider font-bold">To:</strong>
                <span className="font-semibold text-gray-900">{previewAutoReplyInquiry.name} &lt;{previewAutoReplyInquiry.email}&gt;</span>
              </div>
              <div>
                <strong className="text-gray-500 block uppercase text-[10px] tracking-wider font-bold">Subject:</strong>
                <span className="font-semibold text-gray-900">{activeSettings.autoReplySubject || 'Thank you for reaching out to The Unposed Story ✨'}</span>
              </div>
              <hr className="border-gray-200 my-2" />
              <p className="font-semibold text-gray-900">
                {(activeSettings.autoReplyGreeting || 'Dear {name}, thank you for considering us.').replace('{name}', previewAutoReplyInquiry.name)}
              </p>
              <p className="text-gray-700 leading-relaxed">
                {activeSettings.autoReplyMessage || 'We have received your celebration details and date preferences. We will be in touch with you shortly.'}
              </p>
              {activeSettings.autoReplyBrochureUrl && (
                <p className="text-emerald-700">
                  📄 <strong>Brochure &amp; Investment Guide:</strong>{' '}
                  <span className="underline break-all">{activeSettings.autoReplyBrochureUrl}</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100 flex-wrap gap-2">
              <span className="text-[11px] text-gray-400">
                Clicking dispatch pre-fills your client's address and message.
              </span>

              <div className="flex items-center gap-2">
                <a
                  href={StorageService.generateAutoReplyText(previewAutoReplyInquiry, activeSettings).mailToUrl}
                  onClick={() => {
                    handleMarkAutoReplied(previewAutoReplyInquiry.id);
                    setPreviewAutoReplyInquiry(null);
                  }}
                  className="px-4 py-2 rounded-full bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors"
                >
                  Send Email
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewAutoReplyInquiry(null)}
                  className="px-4 py-2 rounded-full border border-gray-200 text-xs font-bold uppercase tracking-wider hover:border-black cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
