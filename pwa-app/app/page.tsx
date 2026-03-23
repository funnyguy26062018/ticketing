'use client'

import { useEffect, useState } from 'react'

export default function Home() {
  const [html, setHtml] = useState('')
  const [gasHtml, setGasHtml] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch your main HTML
    fetch('/my-site/index.html')
      .then(response => response.text())
      .then(htmlContent => {
        setHtml(htmlContent)
        setLoading(false)
      })
      .catch(err => console.error('Error loading HTML:', err))
    
    // Fetch GAS data
    fetch('/api/gas')
      .then(response => response.json())
      .then(data => {
        console.log('GAS response:', data)
        if (data.html) {
          setGasHtml(data.html)
        } else if (data.data) {
          console.log('GAS data:', data.data)
        }
      })
      .catch(err => console.error('GAS fetch error:', err))
  }, [])

  // Inject GAS HTML into the page when it's ready
  useEffect(() => {
    if (gasHtml) {
      window.dispatchEvent(new CustomEvent('gasDataLoaded', { 
        detail: { html: gasHtml }
      }))
    }
  }, [gasHtml])

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