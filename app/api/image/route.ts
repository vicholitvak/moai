
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query') || 'food';
  const orientation = searchParams.get('orientation') || 'landscape';
  // TODO: Replace with process.env.UNSPLASH_ACCESS_KEY
  const accessKey = 'Xldgx1whiesin60J_MBv-F_k8DnCtaRkmrU9yGM26mU';

  try {
    const response = await fetch(`https://api.unsplash.com/photos/random?query=${query}&orientation=${orientation}`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Unsplash API responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({ url: data.urls.regular });

  } catch (error) {
    console.error('Error fetching image from Unsplash:', error);
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
  }
}
