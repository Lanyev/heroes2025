import { useState } from 'react'
import clsx from 'clsx'

/**
 * Text component that truncates and shows tooltip on hover
 * @param {Object} props
 * @param {string} props.text - Full text
 * @param {number} props.maxLength - Max characters before truncation
 * @param {string} props.className - Additional CSS classes
 */
export function TruncatedText({ text, maxLength = 15, className }) {
  const [showTooltip, setShowTooltip] = useState(false)
  
  if (!text) return null
  
  const isTruncated = text.length > maxLength
  const displayText = isTruncated ? text.slice(0, maxLength - 2) + '...' : text

  return (
    <span
      className={clsx('relative inline-block', className)}
      onMouseEnter={() => isTruncated && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {displayText}
      {showTooltip && (
        <span className="absolute left-0 bottom-full mb-1 px-2 py-1 text-xs bg-slate-900 text-white rounded shadow-lg whitespace-nowrap z-50">
          {text}
        </span>
      )}
    </span>
  )
}

/**
 * Truncate text utility for chart axis
 * @param {string} text 
 * @param {number} maxLength 
 * @returns {string}
 */
export function truncateForChart(text, maxLength = 12) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 2) + '..'
}
