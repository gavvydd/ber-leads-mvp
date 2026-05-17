export default function UserSelect({ onSelect }) {
  return (
    <div className="screen">
      <div className="select-logo">💑</div>
      <h1 className="select-title">Gavin & Nicole</h1>
      <p className="select-sub">Who's swiping right now?</p>
      <div className="user-cards">
        <button className="user-card" onClick={() => onSelect('gavin')}>
          <span className="card-emoji">🧑</span>
          Gavin
        </button>
        <button className="user-card" onClick={() => onSelect('nicole')}>
          <span className="card-emoji">💗</span>
          Nicole
        </button>
      </div>
    </div>
  )
}
