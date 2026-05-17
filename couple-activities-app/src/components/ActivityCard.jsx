import { forwardRef, useImperativeHandle, useState, useRef, useEffect } from 'react'

const GRADIENTS = [
  'linear-gradient(135deg,#667eea,#764ba2)',
  'linear-gradient(135deg,#f093fb,#f5576c)',
  'linear-gradient(135deg,#4facfe,#00f2fe)',
  'linear-gradient(135deg,#43e97b,#38f9d7)',
  'linear-gradient(135deg,#fa709a,#fee140)',
  'linear-gradient(135deg,#a18cd1,#fbc2eb)',
  'linear-gradient(135deg,#ffecd2,#fcb69f)',
  'linear-gradient(135deg,#f7971e,#ffd200)',
  'linear-gradient(135deg,#30cfd0,#330867)',
  'linear-gradient(135deg,#a1c4fd,#c2e9fb)',
]

const ActivityCard = forwardRef(function ActivityCard(
  { activity, stackPos, onSwipe, fetchImage },
  ref
) {
  const isTop = stackPos === 0
  const [imageUrl, setImageUrl] = useState(() => {
    const key = `img_${activity.id}`
    return activity.imageUrl || localStorage.getItem(key) || null
  })
  const [flyDir, setFlyDir] = useState(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragging = useRef(false)
  const startX = useRef(0)
  const startY = useRef(0)
  const likeStamp = useRef(null)
  const nopeStamp = useRef(null)

  // Fetch image if not cached
  useEffect(() => {
    if (imageUrl || stackPos > 1) return
    const cacheKey = `img_${activity.id}`
    fetchImage(activity.imageSearch).then(url => {
      if (url) {
        localStorage.setItem(cacheKey, url)
        setImageUrl(url)
      }
    })
  }, [activity.id, stackPos])

  const doSwipe = (dir) => {
    if (flyDir) return
    setFlyDir(dir)
    setTimeout(() => onSwipe(activity, dir), 380)
  }

  useImperativeHandle(ref, () => ({ swipe: doSwipe }))

  const handlePointerDown = (e) => {
    if (!isTop || flyDir) return
    dragging.current = true
    startX.current = e.clientX
    startY.current = e.clientY
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e) => {
    if (!dragging.current) return
    const dx = e.clientX - startX.current
    const dy = e.clientY - startY.current
    setOffset({ x: dx, y: dy * 0.3 })

    if (likeStamp.current) likeStamp.current.style.opacity = Math.max(0, Math.min(1, (dx - 30) / 70))
    if (nopeStamp.current) nopeStamp.current.style.opacity = Math.max(0, Math.min(1, (-dx - 30) / 70))
  }

  const handlePointerUp = (e) => {
    if (!dragging.current) return
    dragging.current = false
    const dx = e.clientX - startX.current
    const threshold = window.innerWidth * 0.27

    if (dx > threshold) doSwipe('right')
    else if (dx < -threshold) doSwipe('left')
    else {
      setOffset({ x: 0, y: 0 })
      if (likeStamp.current) likeStamp.current.style.opacity = 0
      if (nopeStamp.current) nopeStamp.current.style.opacity = 0
    }
  }

  const rot = offset.x * 0.06
  const gradient = GRADIENTS[parseInt(activity.id.replace(/\D/g, ''), 10) % GRADIENTS.length]
    || GRADIENTS[0]

  const cardStyle = {
    zIndex: 10 - stackPos,
    transform: flyDir === 'right'
      ? 'translate(150vw, -10px) rotate(25deg)'
      : flyDir === 'left'
      ? 'translate(-150vw, -10px) rotate(-25deg)'
      : stackPos > 0
      ? `scale(${1 - stackPos * 0.04}) translateY(${stackPos * 9}px)`
      : `translate(${offset.x}px, ${offset.y}px) rotate(${rot}deg)`,
    transition: (flyDir || (!dragging.current && stackPos > 0))
      ? 'transform 0.38s ease'
      : dragging.current ? 'none' : 'transform 0.32s cubic-bezier(0.34,1.56,0.64,1)',
    pointerEvents: isTop ? 'auto' : 'none',
  }

  return (
    <div
      className="activity-card"
      style={cardStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div ref={likeStamp} className="stamp stamp-like">LIKE 💚</div>
      <div ref={nopeStamp} className="stamp stamp-nope">NOPE ❌</div>

      <div className="card-banner" style={{ background: gradient }}>
        {imageUrl
          ? <img src={imageUrl} alt={activity.name} draggable={false} onError={() => setImageUrl(null)} />
          : <span className="card-banner-emoji">{activity.emoji}</span>
        }
        <div className="card-cat">{activity.category}</div>
        {activity.isLive && <div className="card-live-badge">🔴 Live Event</div>}
      </div>

      <div className="card-body">
        <div className="card-name">{activity.name}</div>
        <div className="card-loc">📍 {activity.location}</div>
        <div className="card-desc">{activity.description}</div>
        <div className="card-pills">
          <span className="pill">💰 {activity.price}</span>
          <span className="pill">⏱ {activity.duration}</span>
          <span className="pill">📅 {activity.bestTime}</span>
        </div>
      </div>
    </div>
  )
})

export default ActivityCard
