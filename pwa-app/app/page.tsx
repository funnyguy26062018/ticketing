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

  // After HTML is injected, execute scripts and trigger onload
  useEffect(() => {
    if (!loading && containerRef.current) {
      // Execute all scripts in the injected HTML
      const scripts = containerRef.current.querySelectorAll('script')
      scripts.forEach(oldScript => {
        const newScript = document.createElement('script')
        Array.from(oldScript.attributes).forEach(attr => {
          newScript.setAttribute(attr.name, attr.value)
        })
        newScript.textContent = oldScript.textContent
        oldScript.parentNode?.replaceChild(newScript, oldScript)
      })
      
      // Manually dispatch the load event to trigger window.onload
      // This ensures it fires after our HTML is fully in the DOM
      const loadEvent = new Event('load')
      window.dispatchEvent(loadEvent)
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