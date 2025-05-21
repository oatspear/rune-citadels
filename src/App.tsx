import { useEffect, useState } from "react"
import { PlayerId } from "rune-sdk"
import { GameState, Character } from "./logic"

interface Card {
  id: string
  name: string
  // Add more card properties as needed
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
  const [isHandExpanded, setIsHandExpanded] = useState(false)

  const handleCardSelect = (cardId: string) => {
    setSelectedCardId(selectedCardId === cardId ? null : cardId)
  }

  return (
    <>
      {/* Overlay for hand cards */}
      <div className={`hand-cards-overlay ${isHandExpanded ? "expanded" : ""}`}>
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
      </div>

      {/* Fixed bottom bar */}
      <div className="player-hand">
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
          <button
            className={`expand-hand-button ${isHandExpanded ? "expanded" : ""}`}
            onClick={() => setIsHandExpanded(!isHandExpanded)}
            aria-label={isHandExpanded ? "Collapse hand" : "Expand hand"}
          >
            {isHandExpanded ? "~" : "^"}
          </button>
        </div>
      </div>
    </>
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

  // Temporary mock data for the hand only
  const mockPlayerHand: Card[] = [
    { id: "1", name: "Card 1" },
    { id: "2", name: "Card 2" },
    { id: "3", name: "Card 3" },
  ]

  // Get all players in the game
  const maxPlayers = 4

  // Create array of all player slots
  const playerSlots = Array(maxPlayers)
    .fill(null)
    .map((_, index) => {
      const playerId = game.playerIds[index]

      if (!playerId) {
        // Empty slot
        return {
          coins: 0,
          isCurrentPlayer: false,
        } as PlayerBoardProps
      }

      const playerState = game.playerStates[playerId]
      const isCurrentPlayer = playerId === yourPlayerId

      return {
        playerId,
        coins: playerState?.coins || 0,
        character: playerState?.character,
        isCurrentPlayer,
      } as PlayerBoardProps
    })
    // Sort so that current player appears last
    .sort((a, b) => {
      if (a.isCurrentPlayer) return 1
      if (b.isCurrentPlayer) return -1
      return 0
    })

  // Get current player's state
  const currentPlayerState = yourPlayerId
    ? game.playerStates[yourPlayerId]
    : null

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
          coins={currentPlayerState?.coins || 0}
          character={currentPlayerState?.character}
        />
      </div>
    </div>
  )
}

export default App
