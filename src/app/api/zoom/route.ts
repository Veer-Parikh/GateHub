import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const { meetingNumber, role } = await request.json()
    
    const ZOOM_API_KEY = process.env.ZOOM_API_KEY!
    const ZOOM_API_SECRET = process.env.ZOOM_API_SECRET!
    
    const timestamp = new Date().getTime() - 30000
    const msg = Buffer.from(ZOOM_API_KEY + meetingNumber + timestamp + role).toString('base64')
    
    const hash = crypto.createHmac('sha256', ZOOM_API_SECRET).update(msg).digest('base64')
    const signature = Buffer.from(
      `${ZOOM_API_KEY}.${meetingNumber}.${timestamp}.${role}.${hash}`
    ).toString('base64')

    return NextResponse.json({ signature })
  } catch (error) {
    console.error('Error generating signature:', error)
    return NextResponse.json(
      { error: 'Failed to generate signature' },
      { status: 500 }
    )
  }
}