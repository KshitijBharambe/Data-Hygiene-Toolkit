import { NextRequest, NextResponse } from 'next/server'
import { getApiUrl } from '@/lib/config'

export async function POST(_request: NextRequest) {
  try {
    // Call getApiUrl() at runtime, not at module load
    const apiUrl = getApiUrl()
    const response = await fetch(`${apiUrl}/auth/setup-demo`, {
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
