"use client";

import React, { useState } from 'react';
import { ShieldAlert, X, Check } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetType: 'User' | 'Group' | 'Message' | 'Post' | 'Comment';
  targetName: string;
  reportedUserId: string;
}

export default function ReportModal({ isOpen, onClose, targetId, targetType, targetName, reportedUserId }: ReportModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const reasons = [
    "Spam or misleading",
    "Harassment or bullying",
    "Hate speech",
    "Inappropriate content",
    "Suspicious activity",
    "Other"
  ];

  const handleSubmit = async () => {
    if (!reason) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("timber_token");
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          reportedUserId,
          contentType: targetType,
          contentId: targetId,
          reason
        })
      });

      if (res.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          onClose();
          setIsSuccess(false);
          setReason('');
        }, 2000);
      } else {
        alert("Failed to submit report. Please try again.");
      }
    } catch (err) {
      console.error("[REPORT_SUBMISSION_FAILED]", err);
      alert("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl border border-timber-border animate-in zoom-in duration-300">
        {isSuccess ? (
          <div className="p-12 text-center flex flex-col items-center gap-6">
            <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white animate-in zoom-in duration-500">
              <Check className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-timber-text mb-2">Report Submitted</h3>
              <p className="text-timber-muted">Thank you for helping keep Timber safe. Our moderators will review this shortly.</p>
            </div>
          </div>
        ) : (
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-xl text-red-500">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-timber-text">Report {targetType}</h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-elevated rounded-full transition-colors">
                <X className="w-5 h-5 text-timber-muted" />
              </button>
            </div>

            <p className="text-sm text-timber-muted mb-6">
              You are reporting <span className="font-bold text-timber-text">{targetName}</span>. 
              Please select a reason for this report.
            </p>

            <div className="space-y-2 mb-8">
              {reasons.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                    reason === r 
                      ? 'bg-timber-brand text-white shadow-lg shadow-timber-brand/20' 
                      : 'bg-elevated text-timber-text hover:bg-timber-border/50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {reason === 'Other' && (
              <textarea
                className="w-full p-4 rounded-2xl bg-elevated border border-timber-border focus:border-timber-brand outline-none text-sm mb-6 h-24 resize-none"
                placeholder="Please specify..."
                onChange={(e) => setReason(e.target.value)}
              />
            )}

            <button
              onClick={handleSubmit}
              disabled={!reason || isSubmitting}
              className="w-full py-4 rounded-2xl bg-red-500 text-white font-bold shadow-lg shadow-red-500/20 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Submit Report"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
