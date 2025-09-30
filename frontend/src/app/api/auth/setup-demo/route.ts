import { NextRequest, NextResponse } from 'next/server'
import { getApiUrl } from '@/lib/config'

const API_URL = getApiUrl()

export async function POST(_request: NextRequest) {
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
