import { useState, useEffect, useRef } from 'react'
import {
  collection, doc, setDoc, getDoc, getDocs,
  query, orderBy, onSnapshot, serverTimestamp, deleteDoc
} from 'firebase/firestore'
import { db } from './firebase'
import { activities as staticActivities } from './data/activities'
import UserSelect from './components/UserSelect'
import SwipeScreen from './components/SwipeScreen'
import MatchScreen from './components/MatchScreen'
import MatchesList from './components/MatchesList'

const USERS = {
  gavin:  { id: 'gavin',  name: 'Gavin',  emoji: '🧑', other: 'nicole' },
  nicole: { id: 'nicole', name: 'Nicole', emoji: '💗', other: 'gavin'  },
}

async function fetchImage(searchQuery) {
  try {
    // Production: use serverless proxy; dev: call Pexels directly if key set
    if (import.meta.env.DEV && import.meta.env.VITE_PEXELS_KEY) {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=5&orientation=portrait`,
        { headers: { Authorization: import.meta.env.VITE_PEXELS_KEY } }
      )
      const data = await res.json()
      const photos = data.photos || []
      if (!photos.length) return null
      const photo = photos[Math.floor(Math.random() * photos.length)]
      return photo.src.large2x
    } else if (!import.meta.env.DEV) {
      const res = await fetch(`/api/image?q=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      return data.url || null
    }
  } catch {}
  return null
}

async function fetchLiveEvents() {
  const cacheKey = 'live_events_cache'
  const cacheTime = 'live_events_time'
  const ttl = 3600 * 1000 // 1 hour

  const cached = localStorage.getItem(cacheKey)
  const cachedAt = localStorage.getItem(cacheTime)
  if (cached && cachedAt && Date.now() - parseInt(cachedAt) < ttl) {
    return JSON.parse(cached)
  }

  try {
    const res = await fetch('/api/events')
    const data = await res.json()
    const events = data.events || []
    localStorage.setItem(cacheKey, JSON.stringify(events))
    localStorage.setItem(cacheTime, Date.now().toString())
    return events
  } catch {
    return []
  }
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem('ga_user'))
  const [screen, setScreen] = useState('select')
  const [allActivities, setAllActivities] = useState(staticActivities)
  const [mySwipes, setMySwipes] = useState({})
  const [matches, setMatches] = useState([])
  const [newMatch, setNewMatch] = useState(null)
  const [loading, setLoading] = useState(false)
  const matchInitialized = useRef(false)

  // Boot: load live events once
  useEffect(() => {
    fetchLiveEvents().then(events => {
      if (events.length) {
        // Prepend live events, deduplicate against static by id
        const staticIds = new Set(staticActivities.map(a => a.id))
        const fresh = events.filter(e => !staticIds.has(e.id))
        setAllActivities([...fresh, ...staticActivities])
      }
    })
  }, [])

  // When user is set, load their swipes from Firestore
  useEffect(() => {
    if (!currentUser) return
    setLoading(true)
    getDocs(collection(db, 'users', currentUser, 'swipes'))
      .then(snap => {
        const swipes = {}
        snap.forEach(d => { swipes[d.id] = d.data().direction })
        setMySwipes(swipes)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [currentUser])

  // Listen for matches in real-time
  useEffect(() => {
    const q = query(collection(db, 'matches'), orderBy('matchedAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))

      if (matchInitialized.current) {
        snap.docChanges().forEach(change => {
          if (change.type === 'added') {
            const m = { id: change.doc.id, ...change.doc.data() }
            setNewMatch(m)
            setScreen('match')
          }
        })
      }

      setMatches(all)
      matchInitialized.current = true
    })
    return unsub
  }, [])

  const handleSelectUser = (userId) => {
    localStorage.setItem('ga_user', userId)
    setCurrentUser(userId)
    matchInitialized.current = false
    setScreen('swipe')
  }

  const handleSwipe = async (activity, direction) => {
    // Optimistic local update
    setMySwipes(prev => ({ ...prev, [activity.id]: direction }))

    // Write to Firestore
    await setDoc(doc(db, 'users', currentUser, 'swipes', activity.id), {
      direction,
      swipedAt: serverTimestamp(),
    })

    // Check for match if liked
    if (direction !== 'left') {
      const otherId = USERS[currentUser].other
      const otherRef = doc(db, 'users', otherId, 'swipes', activity.id)
      const otherSnap = await getDoc(otherRef)

      if (otherSnap.exists() && ['right', 'super'].includes(otherSnap.data().direction)) {
        await setDoc(doc(db, 'matches', activity.id), {
          activity,
          matchedAt: serverTimestamp(),
        })
        // onSnapshot will pick this up and show match screen on BOTH phones
      }
    }
  }

  const handleReset = async () => {
    if (!window.confirm('Reset ALL swipes and matches for both of you? Cannot be undone.')) return
    try {
      const [gs, ns, ms] = await Promise.all([
        getDocs(collection(db, 'users', 'gavin', 'swipes')),
        getDocs(collection(db, 'users', 'nicole', 'swipes')),
        getDocs(collection(db, 'matches')),
      ])
      await Promise.all([
        ...gs.docs.map(d => deleteDoc(d.ref)),
        ...ns.docs.map(d => deleteDoc(d.ref)),
        ...ms.docs.map(d => deleteDoc(d.ref)),
      ])
      localStorage.removeItem('live_events_cache')
      localStorage.removeItem('live_events_time')
      setMySwipes({})
      setMatches([])
      setScreen('swipe')
    } catch (e) {
      alert('Reset failed: ' + e.message)
    }
  }

  const unswipedActivities = allActivities.filter(a => !mySwipes[a.id])
  const matchCount = matches.length
  const user = currentUser ? USERS[currentUser] : null

  if (screen === 'select' || !currentUser) {
    return <UserSelect onSelect={handleSelectUser} />
  }

  if (loading) {
    return (
      <div className="screen" style={{ gap: 16 }}>
        <div className="loading-spinner" />
        <p style={{ opacity: 0.6 }}>Loading…</p>
      </div>
    )
  }

  return (
    <>
      {screen === 'swipe' && (
        <SwipeScreen
          user={user}
          activities={unswipedActivities}
          allActivities={allActivities}
          matchCount={matchCount}
          onSwipe={handleSwipe}
          onShowMatches={() => setScreen('matches')}
          onSwitchUser={() => { setCurrentUser(null); localStorage.removeItem('ga_user'); setScreen('select') }}
          fetchImage={fetchImage}
        />
      )}

      {screen === 'match' && newMatch && (
        <MatchScreen
          match={newMatch}
          fetchImage={fetchImage}
          onKeepSwiping={() => { setNewMatch(null); setScreen('swipe') }}
          onShowMatches={() => { setNewMatch(null); setScreen('matches') }}
        />
      )}

      {screen === 'matches' && (
        <MatchesList
          matches={matches}
          fetchImage={fetchImage}
          onBack={() => setScreen('swipe')}
          onReset={handleReset}
        />
      )}
    </>
  )
}
