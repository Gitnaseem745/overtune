'use client';

import React from 'react';
import { MessageSquarePlus, ExternalLink } from 'lucide-react';

interface FeedbackLinkProps {
  className?: string;
  variant?: 'button' | 'link' | 'card';
}

export function FeedbackLink({ className = '', variant = 'button' }: FeedbackLinkProps) {
  const issuesUrl = 'https://github.com/gitnaseem745/overtune/issues';

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      window.open(issuesUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (variant === 'link') {
    return (
      <a
        href={issuesUrl}
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 text-xs text-amber-500 hover:text-amber-400 hover:underline transition-colors ${className}`}
        title="Report an issue or request a feature on GitHub"
      >
        <span>Report issue / Feedback</span>
        <ExternalLink size={12} />
      </a>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`p-4 rounded-2xl border border-neutral-800/60 bg-neutral-900/40 flex items-center justify-between gap-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
            <MessageSquarePlus size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Community Feedback & Ideas</h4>
            <p className="text-[11px] text-neutral-400">
              Found a bug or have a suggestion? Open an issue on GitHub. No account or tracking required.
            </p>
          </div>
        </div>
        <button
          onClick={handleClick}
          className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white transition-colors flex items-center gap-1.5 shrink-0"
        >
          <span>GitHub Issues</span>
          <ExternalLink size={12} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 transition-colors ${className}`}
      title="Open GitHub Issues"
    >
      <MessageSquarePlus size={14} className="text-amber-500" />
      <span>Feedback & Support</span>
      <ExternalLink size={11} className="text-neutral-400" />
    </button>
  );
}
