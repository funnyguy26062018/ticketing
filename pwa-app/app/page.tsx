'use client'

import { useEffect, useState } from 'react'

export default function Home() {
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch your HTML file with basePath
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
    
    // Fetch GAS data through API route
    fetch('/ticketing/api/gas')
      .then(response => response.json())
      .then(data => {
        console.log('GAS data received:', data)
      })
      .catch(err => console.error('GAS fetch error:', err))
  }, [])

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
      dangerouslySetInnerHTML={{ __html: html }}
      suppressHydrationWarning={true}
    />
  )
}