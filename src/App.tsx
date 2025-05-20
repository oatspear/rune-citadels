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

interface PlayerBoardProps {
  playerId?: string // Make playerId optional for empty slots
  coins: number
  character?: Character
  isCurrentPlayer: boolean
}

function PlayerBoard({
  playerId,
  coins,
  character,
  isCurrentPlayer,
}: PlayerBoardProps) {
  const playerInfo = playerId ? Rune.getPlayerInfo(playerId) : null

  return (
    <div className={`player-board ${isCurrentPlayer ? "current-player" : ""}`}>
      <div className="player-board-header">
        {playerInfo ? (
          <img src={playerInfo.avatarUrl} className="player-avatar" />
        ) : (
          <div className="player-avatar empty">?</div>
        )}
        <span className="player-name">
          {playerInfo ? playerInfo.displayName : "Waiting for player..."}
        </span>
      </div>
      <div className="player-board-stats">
        <div className="board-coins">
          <span className="coin-icon small">🪙</span> {coins}
        </div>
        {character && (
          <div className="board-character">
            <span className="character-icon small">{character.icon}</span>
            {character.name}
          </div>
        )}
      </div>
    </div>
  )
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

  // Create array of 4 player slots
  const playerSlots = Array(4)
    .fill(null)
    .map((_, index) => {
      // If this is the current player's slot
      if (playerInfo && index === 0) {
        return {
          playerId: playerInfo.playerId,
          coins: mockCoins,
          character: mockCharacter,
          isCurrentPlayer: true,
        }
    }
    // For other slots, create empty or mock players
      return {
      coins: index === 2 ? 7 : 3, // Mock different coin amounts
        character:
          index === 2 ? { id: 2, name: "Thief", icon: "🦹" } : undefined,
        isCurrentPlayer: false,
    }
  })

  return (
    <div className="game-container">
      <div className="main-area">
        <div className="game-boards">
          {playerSlots.map((player, index) => (
            <PlayerBoard key={index} {...player} />
          ))}
        </div>
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
