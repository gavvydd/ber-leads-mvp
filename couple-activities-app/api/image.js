// Vercel serverless function — proxies Pexels API so the key stays server-side
export default async function handler(req, res) {
  const { q } = req.query
  const key = process.env.PEXELS_KEY

  res.setHeader('Access-Control-Allow-Origin', '*')

  if (!key || !q) {
    return res.status(200).json({ url: null })
  }

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=5&orientation=portrait`,
      { headers: { Authorization: key } }
    )
    const data = await response.json()
    const photos = data.photos || []
    if (!photos.length) return res.status(200).json({ url: null })

    const photo = photos[Math.floor(Math.random() * photos.length)]
    res.status(200).json({ url: photo.src.large2x, photographer: photo.photographer })
  } catch {
    res.status(200).json({ url: null })
  }
}
