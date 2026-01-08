import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Waysorted - One powerful suite for designers'
export const size = {
    width: 1200,
    height: 630,
}

export const contentType = 'image/png'

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    fontSize: 80,
                    background: '#265BD1',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontFamily: 'sans-serif',
                    textAlign: 'center',
                    padding: '40px',
                }}
            >
                <div style={{ fontWeight: 'bold', marginBottom: '20px' }}>Waysorted</div>
                <div style={{ fontSize: 40, opacity: 0.9 }}>Accelerate every idea with one powerful suite</div>
            </div>
        ),
        {
            ...size,
        }
    )
}
