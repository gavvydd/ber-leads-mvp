// Vercel serverless function — fetches live Irish events from Eventbrite
export default async function handler(req, res) {
  const key = process.env.EVENTBRITE_KEY

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=3600') // cache on CDN for 1 hour

  if (!key) {
    return res.status(200).json({ events: [] })
  }

  try {
    const response = await fetch(
      `https://www.eventbriteapi.com/v3/events/search/?location.address=Ireland&expand=venue,ticket_availability,logo&sort_by=date&page_size=30`,
      { headers: { Authorization: `Bearer ${key}` } }
    )
    const data = await response.json()
    const events = (data.events || []).map((e, i) => ({
      id: `eb_${e.id}`,
      name: e.name?.text || 'Untitled Event',
      emoji: '🎟️',
      category: 'Live Event',
      location: e.venue?.address?.city || e.venue?.name || 'Ireland',
      country: 'Ireland',
      description: (e.description?.text || e.summary || '').slice(0, 220),
      price: e.is_free ? 'Free' : `€${e.ticket_availability?.minimum_ticket_price?.major_value ?? '?'}+`,
      duration: 'Check listing',
      bestTime: e.start?.local ? new Date(e.start.local).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBC',
      difficulty: 'Easy',
      tips: [e.url ? `Book at: ${e.url}` : 'Check Eventbrite for tickets'],
      imageSearch: `${e.name?.text || 'event ireland'} concert festival`,
      imageUrl: e.logo?.url || null,
      isLive: true,
    }))

    res.status(200).json({ events })
  } catch (err) {
    res.status(200).json({ events: [], error: err.message })
  }
}
