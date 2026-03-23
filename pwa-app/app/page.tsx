'use client'

import { useEffect, useState } from 'react'

export default function Home() {
  const [html, setHtml] = useState('')
  const [gasData, setGasData] = useState(null)
  const [loading, setLoading] = useState(true)

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
    
    // Fetch GAS data
    fetch('/ticketing/api/gas')
      .then(response => response.json())
      .then(data => {
        console.log('GAS data received:', data)
        setGasData(data)
        // Dispatch event for the HTML to receive
        window.dispatchEvent(new CustomEvent('gasDataLoaded', { 
          detail: data 
        }))
      })
      .catch(err => console.error('GAS fetch error:', err))
  }, [])

  // Also dispatch when gasData changes
  useEffect(() => {
    if (gasData) {
      window.dispatchEvent(new CustomEvent('gasDataLoaded', { 
        detail: gasData 
      }))
    }
  }, [gasData])

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