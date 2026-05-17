import { useEffect, useState, useRef } from 'react'

function Confetti() {
  const colors = ['#FF6B6B','#4ECDC4','#FFD700','#FF8E53','#a29bfe','#fd79a8','#00b894','#74b9ff']
  const pieces = Array.from({ length: 90 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    size: Math.random() * 12 + 5,
    color: colors[Math.floor(Math.random() * colors.length)],
    circle: Math.random() > 0.5,
    delay: Math.random() * 0.6,
    duration: Math.random() * 1.5 + 1.2,
  }))

  return (
    <div className="confetti-layer">
      {pieces.map(p => (
        <div
          key={p.id}
          className="cf"
          style={{
            left: `${p.left}%`,
            top: '-20px',
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: p.circle ? '50%' : '3px',
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

export default function MatchScreen({ match, fetchImage, onKeepSwiping, onShowMatches }) {
  const { activity } = match
  const [imageUrl, setImageUrl] = useState(() => {
    return activity?.imageUrl || localStorage.getItem(`img_${activity?.id}`) || null
  })
  const loaded = useRef(false)

  useEffect(() => {
    if (imageUrl || loaded.current || !activity) return
    loaded.current = true
    fetchImage(activity.imageSearch).then(url => {
      if (url) {
        localStorage.setItem(`img_${activity.id}`, url)
        setImageUrl(url)
      }
    })
  }, [activity?.id])

  if (!activity) return null

  return (
    <>
      <Confetti />
      <div className="screen match-screen">
        <div className="match-heading">🎉 It's a Match!</div>
        <div className="match-sub">You both want to do this one!</div>

        <div className="match-card">
          {imageUrl
            ? <img className="match-card-img" src={imageUrl} alt={activity.name} />
            : <div className="match-card-emoji">{activity.emoji}</div>
          }
          <div className="match-card-name">{activity.name}</div>
          <div className="match-card-loc">📍 {activity.location}</div>

          <div className="detail-grid">
            <div className="detail-box">
              <div className="detail-lbl">💰 Price</div>
              <div className="detail-val">{activity.price}</div>
            </div>
            <div className="detail-box">
              <div className="detail-lbl">⏱ Duration</div>
              <div className="detail-val">{activity.duration}</div>
            </div>
            <div className="detail-box">
              <div className="detail-lbl">📅 Best Time</div>
              <div className="detail-val">{activity.bestTime}</div>
            </div>
            <div className="detail-box">
              <div className="detail-lbl">⭐ Level</div>
              <div className="detail-val">{activity.difficulty}</div>
            </div>
          </div>

          {activity.tips?.length > 0 && (
            <div className="tips-box">
              <h4>💡 Tips & Need to Know</h4>
              <ul>{activity.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
            </div>
          )}
        </div>

        <div className="match-btns">
          <button className="mbtn mbtn-ghost" onClick={onKeepSwiping}>Keep Swiping</button>
          <button className="mbtn mbtn-solid" onClick={onShowMatches}>See All Matches</button>
        </div>
      </div>
    </>
  )
}
