import { useState, useEffect } from 'react'

function MatchItem({ match, fetchImage }) {
  const { activity } = match
  const [imageUrl, setImageUrl] = useState(() => {
    return activity?.imageUrl || localStorage.getItem(`img_${activity?.id}`) || null
  })

  useEffect(() => {
    if (imageUrl || !activity) return
    fetchImage(activity.imageSearch).then(url => {
      if (url) {
        localStorage.setItem(`img_${activity.id}`, url)
        setImageUrl(url)
      }
    })
  }, [activity?.id])

  if (!activity) return null

  return (
    <div className="match-item">
      {imageUrl && <img className="match-item-img" src={imageUrl} alt={activity.name} />}
      <div className="match-item-body">
        <div className="mli-header">
          <div className="mli-icon">{activity.emoji}</div>
          <div className="mli-info">
            <h3>{activity.name}</h3>
            <p>📍 {activity.location}</p>
          </div>
        </div>

        <div className="mli-grid">
          <div className="mli-cell">
            <div className="lbl">💰 Price</div>
            <div className="val">{activity.price}</div>
          </div>
          <div className="mli-cell">
            <div className="lbl">⏱ Duration</div>
            <div className="val">{activity.duration}</div>
          </div>
          <div className="mli-cell">
            <div className="lbl">📅 Best Time</div>
            <div className="val">{activity.bestTime}</div>
          </div>
          <div className="mli-cell">
            <div className="lbl">⭐ Level</div>
            <div className="val">{activity.difficulty}</div>
          </div>
        </div>

        {activity.tips?.length > 0 && (
          <div className="mli-tips">
            <div className="lbl">💡 Tips</div>
            {activity.tips.map((t, i) => (
              <div key={i} className="mli-tip">{t}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function MatchesList({ matches, fetchImage, onBack, onReset }) {
  return (
    <>
      <div className="matches-topbar">
        <button className="chip" onClick={onBack}>← Back</button>
        <span className="matches-topbar-title">❤️ Your Matches</span>
        <button className="chip chip-reset" onClick={onReset}>Reset</button>
      </div>

      <div className="screen matches-screen">
        <div className="matches-list">
          {matches.length === 0 ? (
            <div className="no-matches">
              <div className="no-matches-emoji">💔</div>
              <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>No matches yet!</p>
              <p style={{ marginTop: 8, fontSize: '0.85rem' }}>
                Both of you need to swipe right on the same activity
              </p>
            </div>
          ) : (
            matches.map(m => (
              <MatchItem key={m.id} match={m} fetchImage={fetchImage} />
            ))
          )}
        </div>
      </div>
    </>
  )
}
