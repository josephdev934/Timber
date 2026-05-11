import React from 'react';

/**
 * ==========================================
 * UTILITY: renderTextWithMentions
 * ==========================================
 * Parses a string and wraps @usernames in a styled span.
 */
export function renderTextWithMentions(text: string) {
  if (!text) return null;

  // Regex to find @username (alphanumeric and underscores)
  const parts = text.split(/(@\w+)/g);

  return parts.map((part, index) => {
    if (part.startsWith('@')) {
      return (
        <span 
          key={index} 
          className="font-bold text-[#775839] hover:underline cursor-pointer bg-[#77583911] px-1 rounded"
        >
          {part}
        </span>
      );
    }
    return part;
  });
}
