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

  // After HTML is injected, manually trigger initialization
  useEffect(() => {
    if (!loading && containerRef.current) {
      // Find and execute any scripts that need to run
      const scripts = containerRef.current.querySelectorAll('script')
      scripts.forEach(oldScript => {
        const newScript = document.createElement('script')
        Array.from(oldScript.attributes).forEach(attr => {
          newScript.setAttribute(attr.name, attr.value)
        })
        newScript.textContent = oldScript.textContent
        oldScript.parentNode?.replaceChild(newScript, oldScript)
      })
      
      // Manually trigger window.onload if it exists
      if (typeof window.onload === 'function') {
        window.onload()
      }
      
      // Or trigger any specific initialization functions
      if (typeof window.initPage === 'function') {
        window.initPage()
      }
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