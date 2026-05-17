import { useRef } from 'react'
import ActivityCard from './ActivityCard'

export default function SwipeScreen({
  user, activities, allActivities, matchCount,
  onSwipe, onShowMatches, onSwitchUser, fetchImage,
}) {
  const topCardRef = useRef(null)

  const handleSwipe = async (activity, dir) => {
    await onSwipe(activity, dir)
  }

  const done = allActivities.length - activities.length
  const total = allActivities.length
  const progress = total > 0 ? (done / total) * 100 : 0

  if (activities.length === 0) {
    return (
      <div className="screen empty-screen">
        <div className="empty-emoji">🎊</div>
        <div className="empty-title">All done!</div>
        <div className="empty-sub">Pass it to {user.id === 'gavin' ? 'Nicole' : 'Gavin'} to swipe too</div>
        <button className="btn-primary" onClick={onShowMatches}>See Your Matches ❤️</button>
        <button className="btn-ghost" style={{ marginTop: 10 }} onClick={onSwitchUser}>Switch User</button>
      </div>
    )
  }

  return (
    <>
      <div className="topbar">
        <button className="chip" onClick={onSwitchUser}>
          {user.emoji} {user.name}
        </button>
        <button className="chip chip-match" onClick={onShowMatches}>
          ❤️ Matches {matchCount > 0 && <strong style={{ marginLeft: 4 }}>{matchCount}</strong>}
        </button>
        <button className="chip" onClick={onSwitchUser} style={{ fontSize: '0.78rem' }}>
          Switch
        </button>
      </div>

      <div className="card-stage">
        {activities.slice(0, 3).map((act, i) => (
          <ActivityCard
            key={act.id}
            ref={i === 0 ? topCardRef : null}
            activity={act}
            stackPos={i}
            onSwipe={handleSwipe}
            fetchImage={fetchImage}
          />
        ))}
      </div>

      <div className="progress-wrap">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="action-row">
        <button
          className="act-btn act-btn-nope"
          onClick={() => topCardRef.current?.swipe('left')}
          title="Nope"
        >❌</button>
        <button
          className="act-btn act-btn-super"
          onClick={() => topCardRef.current?.swipe('super')}
          title="Super Like"
        >⭐</button>
        <button
          className="act-btn act-btn-like"
          onClick={() => topCardRef.current?.swipe('right')}
          title="Like"
        >💚</button>
      </div>
    </>
  )
}
