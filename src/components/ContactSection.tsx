import React, { useState } from 'react';
import { SiteSettings, PackageItem } from '../types';
import { StorageService } from '../services/storage';
import { Mail, Phone, Instagram, MapPin, Send, CheckCircle2, AlertCircle, Package } from 'lucide-react';
import { motion } from 'motion/react';

interface ContactSectionProps {
  settings: SiteSettings;
  packages?: PackageItem[];
  selectedPackageName?: string;
  onInquirySubmitted?: () => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  settings,
  packages = [],
  selectedPackageName,
  onInquirySubmitted,
}) => {
  const [selectedPackage, setSelectedPackage] = useState<string>(selectedPackageName || '');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    weddingDate: '',
    selectedPackage: selectedPackageName || '',
    message: selectedPackageName
      ? `Hi Sandip, we would love to check availability for the "${selectedPackageName}" package!`
      : '',
  });

  React.useEffect(() => {
    if (selectedPackageName) {
      setSelectedPackage(selectedPackageName);
      setFormData((prev) => ({
        ...prev,
        selectedPackage: selectedPackageName,
        message: prev.message || `Hi Sandip, we would love to check availability for the "${selectedPackageName}" package!`,
      }));
    }
  }, [selectedPackageName]);

  const handlePackageChange = (packageName: string) => {
    setSelectedPackage(packageName);
    setFormData((prev) => {
      let updatedMessage = prev.message;
      if (packageName) {
        if (!prev.message || prev.message.includes('Hi Sandip, we would love to check availability for')) {
          updatedMessage = `Hi Sandip, we would love to check availability for the "${packageName}" package!`;
        }
      }
      return {
        ...prev,
        selectedPackage: packageName,
        message: updatedMessage,
      };
    });
  };

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setErrorMessage('Please fill in your name, email address, and message.');
      return;
    }

    setLoading(true);
    try {
      const fullMessage = formData.selectedPackage
        ? `[Selected Package: ${formData.selectedPackage}]\n\n${formData.message.trim()}`
        : formData.message.trim();

      StorageService.addInquiry({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        weddingDate: formData.weddingDate || undefined,
        message: fullMessage,
      });

      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        weddingDate: '',
        selectedPackage: '',
        message: '',
      });
      setSelectedPackage('');

      if (onInquirySubmitted) {
        onInquirySubmitted();
      }
    } catch (err: any) {
      setErrorMessage('Could not send your inquiry. Please try again or reach out via WhatsApp.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-24 md:py-32 bg-[#111827] text-white">
      <div className="max-w-[1240px] mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-16 items-start">
          {/* Left Column: Direct Info & Narrative */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-400 text-[10px] uppercase tracking-widest font-bold mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>{settings.contactBadge || 'Get in Touch'}</span>
            </div>

            <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.1] tracking-tight mb-6 text-white">
              {settings.contactHeadline || "Let's tell your story."}
            </h2>

            <p className="text-gray-300 text-sm md:text-base font-normal leading-relaxed mb-8">
              {settings.contactSubtext || 'Every celebration is distinct. Share your wedding dates, vision, and destinations with us so we can document your story seamlessly.'}
            </p>

            {settings.locationsLine && (
              <div className="flex items-center gap-2.5 text-xs uppercase tracking-wider text-gray-400 mb-8 font-semibold">
                <MapPin className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{settings.locationsLine}</span>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {settings.contactEmail && (
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-white text-gray-900 text-xs uppercase tracking-widest font-bold hover:bg-gray-100 transition-colors w-fit"
                >
                  <Mail className="w-4 h-4 text-gray-900" />
                  <span>{settings.contactEmail}</span>
                </a>
              )}

              {settings.contactPhone && (
                <a
                  href={`tel:${settings.contactPhone.replace(/\s+/g, '')}`}
                  className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-white/10 border border-white/20 text-white text-xs uppercase tracking-widest font-semibold hover:bg-white/20 transition-colors w-fit"
                >
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>{settings.contactPhone}</span>
                </a>
              )}

              {settings.instagram && (
                <a
                  href={`https://instagram.com/${settings.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-white/10 border border-white/20 text-white text-xs uppercase tracking-widest font-semibold hover:bg-white/20 transition-colors w-fit"
                >
                  <Instagram className="w-4 h-4 text-pink-400" />
                  <span>@{settings.instagram.replace('@', '')}</span>
                </a>
              )}
            </div>

            {settings.footerLine && (
              <p className="text-gray-400 text-base md:text-lg mt-12 font-medium">
                "{settings.footerLine}"
              </p>
            )}
          </motion.div>

          {/* Right Column: Interactive Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.75, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7 bg-white/5 backdrop-blur-md p-8 sm:p-12 rounded-2xl border border-white/10 shadow-2xl"
          >
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">Inquiry Received</h3>
                <p className="text-gray-300 text-sm md:text-base font-normal max-w-md mx-auto leading-relaxed mb-6">
                  Thank you for reaching out! Sandip and the team will review your dates and connect back within 24 hours.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-2.5 rounded-full border border-white/30 text-xs uppercase tracking-widest font-semibold hover:bg-white hover:text-black transition-all cursor-pointer"
                >
                  Send another note
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} id="wedding-inquiry-form" className="space-y-6">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-gray-300 mb-2 font-bold">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Riya Sharma & Arjun Mehra"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-white focus:bg-white/15 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-gray-300 mb-2 font-bold">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="you@domain.com"
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-white focus:bg-white/15 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-gray-300 mb-2 font-bold">
                      Phone / WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-white focus:bg-white/15 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-gray-300 mb-2 font-bold">
                      Celebration Date(s) &amp; City / Destination
                    </label>
                    <input
                      type="text"
                      value={formData.weddingDate}
                      onChange={(e) => setFormData({ ...formData, weddingDate: e.target.value })}
                      placeholder="e.g. 18–20 December 2026 · Udaipur"
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-white focus:bg-white/15 transition-all"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-[11px] uppercase tracking-wider text-gray-300 font-bold">
                        Interested Package
                      </label>
                      {formData.selectedPackage && (
                        <button
                          type="button"
                          onClick={() => handlePackageChange('')}
                          className="text-[10px] text-gray-400 hover:text-white underline cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <select
                        id="contact-package-select"
                        value={formData.selectedPackage}
                        onChange={(e) => handlePackageChange(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-white focus:bg-white/15 transition-all appearance-none cursor-pointer pr-10"
                      >
                        <option value="" className="bg-gray-900 text-gray-300">
                          -- Select a Package / Custom Option --
                        </option>
                        {packages.map((pkg) => (
                          <option key={pkg.id} value={pkg.name} className="bg-gray-900 text-white">
                            {pkg.name} ({pkg.price})
                          </option>
                        ))}
                        <option value="Custom Photography & Film" className="bg-gray-900 text-white">
                          Custom Photography &amp; Film (Tailored)
                        </option>
                        <option value="Pre-Wedding Shoot Only" className="bg-gray-900 text-white">
                          Pre-Wedding Shoot Only
                        </option>
                        <option value="Destination Wedding Story" className="bg-gray-900 text-white">
                          Destination Wedding Story (Full Team)
                        </option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-400">
                        <Package className="w-4 h-4 text-emerald-400" />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-gray-300 mb-2 font-bold">
                    Tell us about your wedding &amp; requirements *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe your ceremonies, expected guests, photo/film preferences..."
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-white focus:bg-white/15 transition-all resize-none"
                  />
                </div>

                {errorMessage && (
                  <div className="flex items-center gap-2 p-3 bg-red-950/60 border border-red-400/40 rounded-xl text-red-200 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  id="submit-inquiry-btn"
                  className="w-full py-4 rounded-full bg-white text-black text-xs uppercase tracking-widest font-extrabold flex items-center justify-center gap-2 hover:bg-gray-100 transition-all duration-200 shadow-xl cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span>Submitting Inquiry...</span>
                  ) : (
                    <>
                      <span>Send Wedding Inquiry</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
