import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NODE_ENV === 'production'
  ? process.env.NEXT_PUBLIC_API_URL_PROD || 'https://data-hygiene-toolkit.fly.dev'
  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const response = await fetch(`${API_URL}/auth/setup-demo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Setup demo error:', error)
    return NextResponse.json(
      { detail: 'Failed to setup demo account' },
      { status: 500 }
    )
  }
}
