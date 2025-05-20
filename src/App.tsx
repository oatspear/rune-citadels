import { useEffect, useState } from "react"
import { PlayerId } from "rune-sdk"
import { GameState } from "./logic"

interface Card {
  id: string
  name: string
  // Add more card properties as needed
}

interface Character {
  id: number
  name: string
  icon: string // We'll use emojis for now, can be replaced with images later
}

interface PlayerHandProps {
  cards: Card[]
  coins: number
  character?: Character // Optional because player might not have selected a character yet
}

function PlayerHand({ cards, coins, character }: PlayerHandProps) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)

  const handleCardSelect = (cardId: string) => {
    setSelectedCardId(selectedCardId === cardId ? null : cardId)
  }

  return (
    <div className="player-hand">
      <div className="hand-cards">
        {cards.map((card) => (
          <div
            key={card.id}
            className={`card ${selectedCardId === card.id ? "selected" : ""}`}
            onClick={() => handleCardSelect(card.id)}
          >
            {card.name}
          </div>
        ))}
      </div>
      <div className="player-status">
        <div className="coin-counter">
          <span className="coin-icon">🪙</span>
          <span className="coin-amount">{coins}</span>
        </div>
        <div className="character-display">
          <span className="character-icon">
            {character ? character.icon : "👤"}
          </span>
          <span className="character-name">
            {character ? character.name : "No character selected"}
          </span>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [game, setGame] = useState<GameState>()
  const [yourPlayerId, setYourPlayerId] = useState<PlayerId | undefined>()

  useEffect(() => {
    Rune.initClient({
      onChange: ({ game, yourPlayerId }) => {
        setGame(game)
        setYourPlayerId(yourPlayerId)
      },
    })
  }, [])

  if (!game) {
    return null
  }

  // Temporary mock data - will be replaced with actual game state
  const mockPlayerHand: Card[] = [
    { id: "1", name: "Card 1" },
    { id: "2", name: "Card 2" },
    { id: "3", name: "Card 3" },
  ]
  const mockCoins = 5
  const mockCharacter: Character = {
    id: 1,
    name: "Assassin",
    icon: "🗡️",
  }

  const playerInfo = yourPlayerId ? Rune.getPlayerInfo(yourPlayerId) : null

  return (
    <div className="game-container">
      <div className="main-area">
        {playerInfo && (
          <div className="player-info">
            Playing as: {playerInfo.displayName}
          </div>
        )}
      </div>
      <div className="bottom-area">
        <PlayerHand
          cards={mockPlayerHand}
          coins={mockCoins}
          character={mockCharacter}
        />
      </div>
    </div>
  )
}

export default App
