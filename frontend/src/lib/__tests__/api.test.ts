import { afterEach, describe, expect, it, vi } from 'vitest'
import { api, initApiClient } from '../api'

describe('API error responses', () => {
  const showToast = vi.fn()

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('reads a non-JSON error body only once and surfaces the HTTP error', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      '<html>Service unavailable</html>',
      { status: 502, statusText: 'Bad Gateway' },
    ))
    vi.stubGlobal('fetch', fetchMock)
    initApiClient(() => null, showToast)

    await expect(api.transformer.risk()).rejects.toMatchObject({
      name: 'ApiError',
      status: 502,
      body: '<html>Service unavailable</html>',
      message: 'HTTP 502: Bad Gateway',
    })

    expect(showToast).toHaveBeenCalledWith('HTTP 502: Bad Gateway', 'error')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('uses the detail message from a JSON error response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ detail: 'Transformer unavailable' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    )))
    initApiClient(() => null, showToast)

    await expect(api.transformer.risk()).rejects.toMatchObject({
      status: 503,
      body: { detail: 'Transformer unavailable' },
      message: 'Transformer unavailable',
    })

    expect(showToast).toHaveBeenCalledWith('Transformer unavailable', 'error')
  })
})
