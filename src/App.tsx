import { useEffect, useState } from "react"
import { PlayerId } from "rune-sdk"
import { GameState, Character } from "./logic"

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

interface CharacterSelectProps {
  characters: Character[]
  onSelect: (character: Character) => void
  isExpanded: boolean
}

function CharacterSelect({
  characters,
  onSelect,
  isExpanded,
}: CharacterSelectProps) {
  return (
    <div className={`character-select-overlay ${isExpanded ? "expanded" : ""}`}>
      <div className="character-grid">
        {characters.map((character) => (
          <div
            key={character.id}
            className="character-option"
            onClick={() => onSelect(character)}
          >
            <span className="character-icon">{character.icon}</span>
            <span className="character-name">{character.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PlayerHand({
  coins,
  character,
  onCharacterSelect,
  availableCharacters,
}: {
  coins: number
  character?: Character
  onCharacterSelect: (character: Character) => void
  availableCharacters: Character[]
}) {
  const [isCharacterSelectOpen, setIsCharacterSelectOpen] = useState(false)

  return (
    <>
      <CharacterSelect
        characters={availableCharacters}
        onSelect={(char) => {
          onCharacterSelect(char)
          setIsCharacterSelectOpen(false)
        }}
        isExpanded={isCharacterSelectOpen}
      />

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
            className={`expand-hand-button ${isCharacterSelectOpen ? "expanded" : ""}`}
            onClick={() => setIsCharacterSelectOpen(!isCharacterSelectOpen)}
            aria-label={
              isCharacterSelectOpen ? "Hide characters" : "Select character"
            }
          >
            {isCharacterSelectOpen ? "~" : "^"}
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

  // Available characters
  const characters: Character[] = [
    { id: 1, name: "Assassin", icon: "🗡️" },
    { id: 2, name: "Thief", icon: "🦹" },
    { id: 3, name: "Magician", icon: "🧙" },
    { id: 4, name: "King", icon: "👑" },
    { id: 5, name: "Bishop", icon: "⛪" },
    { id: 6, name: "Merchant", icon: "💰" },
    { id: 7, name: "Architect", icon: "🏗️" },
    { id: 8, name: "Warlord", icon: "⚔️" },
  ]

  // Get available characters (not taken by other players)
  const takenCharacterIds = new Set(
    Object.values(game.playerStates)
      .map((state) => state.character?.id)
      .filter(Boolean)
  )

  const availableCharacters = characters.filter(
    (c) => !takenCharacterIds.has(c.id)
  )

  // Handle character selection
  const handleCharacterSelect = (character: Character) => {
    if (yourPlayerId) {
      Rune.actions.selectCharacter(character.id)
    }
  }

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
          coins={currentPlayerState?.coins || 0}
          character={currentPlayerState?.character}
          onCharacterSelect={handleCharacterSelect}
          availableCharacters={availableCharacters}
        />
      </div>
    </div>
  )
}

export default App
