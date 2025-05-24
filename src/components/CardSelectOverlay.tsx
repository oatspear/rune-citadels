import { District } from "../logic"

interface CardSelectOverlayProps {
  cards: District[]
  onSelect: (card: District, keepIndex: number) => void
  active: boolean
}

export function CardSelectOverlay({
  cards,
  onSelect,
  active,
}: CardSelectOverlayProps) {
  if (!active || cards.length === 0) return null

  return (
    <div className={`card-select-overlay ${active ? "expanded" : ""}`}>
      <div className="card-select-title">Choose one card to keep:</div>
      <div className="card-select-cards">
        {cards.map((card, index) => (
          <div
            key={card.id}
            className={`district ${card.type}`}
            onClick={() => onSelect(card, index)}
          >
            <div className="district-cost">{card.cost}</div>
            <div className="district-name">{card.name}</div>
            <div className="district-type">{card.type}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
