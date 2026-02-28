export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const key = process.env.AZURE_SPEECH_KEY
  const region = process.env.AZURE_SPEECH_REGION

  if (!key || !region) {
    const missing: string[] = []
    if (!key) missing.push('AZURE_SPEECH_KEY')
    if (!region) missing.push('AZURE_SPEECH_REGION')

    console.error('[SPEECH TOKEN] missing env vars:', missing.join(', '))
    return Response.json(
      { error: 'Missing speech credentials', missing },
      { status: 500 },
    )
  }

  const url = `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`
  console.log('[SPEECH TOKEN] requesting token from:', url)

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Ocp-Apim-Subscription-Key': key },
    cache: 'no-store',
  })

  if (!response.ok) {
    const details = await response.text().catch(() => '')

    console.error('[SPEECH TOKEN] service error', {
      status: response.status,
      statusText: response.statusText,
      requestId:
        response.headers.get('apim-request-id') ??
        response.headers.get('x-ms-request-id') ??
        response.headers.get('x-ms-client-request-id'),
      details,
    })

    return Response.json(
      { error: 'Failed to get token', status: response.status, details },
      { status: 500 },
    )
  }

  const token = await response.text()
  console.log('[SPEECH TOKEN] generated successfully', {
    tokenLength: token.length,
    region,
  })

  return Response.json(
    { token, region },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  )
}
