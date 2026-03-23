import { NextResponse } from 'next/server'

export async function GET() {
  const gasUrl = 'https://script.google.com/macros/s/AKfycbzfiG_GjLQ0WFQZLJcq8fs2yfXKB26p3KGRcMh0HEIb3dYJoqYR662XVqScbEvdzJYb/exec'
  const parameters = "function=getOpenTicketsHTML"
  const fullUrl = `${gasUrl}?${parameters}`
  
  console.log('Attempting to fetch from GAS URL:', fullUrl)
  
  try {
    const response = await fetch(fullUrl)
    const htmlContent = await response.text()
    
    // Check if we got valid HTML
    if (htmlContent.includes('<!doctype') || htmlContent.includes('<html')) {
      // Return the HTML content as a string
      return NextResponse.json({ 
        html: htmlContent,
        type: 'html'
      })
    } else {
      // Try to parse as JSON if it's not HTML
      const jsonData = JSON.parse(htmlContent)
      return NextResponse.json({ 
        data: jsonData,
        type: 'json'
      })
    }
    
  } catch (error) {
    console.error('Detailed error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch from GAS',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}