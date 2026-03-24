'use client'

import { useEffect, useState, useRef } from 'react'

export default function Home() {
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Fetch your HTML file
    fetch('/ticketing/my-site/index.html')
      .then(response => response.text())
      .then(htmlContent => {
        setHtml(htmlContent)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error loading HTML:', err)
        setLoading(false)
      })
  }, [])

  // After HTML is injected, just execute scripts - let natural events fire
  useEffect(() => {
    if (!loading && containerRef.current) {
      // Execute any scripts so they can attach their event listeners
      const scripts = containerRef.current.querySelectorAll('script')
      scripts.forEach(oldScript => {
        const newScript = document.createElement('script')
        Array.from(oldScript.attributes).forEach(attr => {
          newScript.setAttribute(attr.name, attr.value)
        })
        newScript.textContent = oldScript.textContent
        oldScript.parentNode?.replaceChild(newScript, oldScript)
      })
      // No manual calls to initPage or onload
      // The page's natural window.onload will fire on its own
    }
  }, [loading, html])

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'sans-serif'
      }}>
        Loading...
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      dangerouslySetInnerHTML={{ __html: html }}
      suppressHydrationWarning={true}
    />
  )
}