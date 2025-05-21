import { useEffect, useState } from "react"
import { PlayerId } from "rune-sdk"
import { GameState, Character, District } from "./logic"

// Constants
const MAX_PLAYERS = 4

// Component interfaces and implementations
interface PlayerBoardProps {
  playerId?: string
  coins: number
  character?: Character
  isCurrentPlayer: boolean
  city?: District[]
}

function CityDistrict({ district }: { district: District }) {
  return (
    <div
      className={`district ${district.type}`}
      title={`${district.name} (${district.cost})`}
    >
      <div className="district-cost">{district.cost}</div>
      <div className="district-name">{district.name}</div>
      <div className="district-type">{district.type}</div>
    </div>
  )
}

function PlayerBoard({
  playerId,
  coins,
  character,
  isCurrentPlayer,
  city = [],
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
      <div className="player-city">
        {city.map((district, index) => (
          <CityDistrict key={`${district.id}-${index}`} district={district} />
        ))}
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

interface HandCardsListProps {
  cards: District[]
  coins: number
  onSelect: (card: District) => void
  isExpanded: boolean
}

function HandCardsList({
  cards,
  coins,
  onSelect,
  isExpanded,
}: HandCardsListProps) {
  return (
    <div className={`hand-cards-overlay ${isExpanded ? "expanded" : ""}`}>
      <div className="hand-cards-list">
        {cards.map((card) => (
          <div
            key={card.id}
            className={`district ${card.type} ${
              coins >= card.cost ? "buildable" : "not-buildable"
            }`}
            onClick={() => coins >= card.cost && onSelect(card)}
            title={
              coins >= card.cost
                ? `Build ${card.name} (${card.cost} coins)`
                : `Not enough coins to build ${card.name} (need ${card.cost})`
            }
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

function PlayerHand({
  character,
  onCharacterSelect,
  availableCharacters,
  cards,
  coins,
  onCardSelect,
  onSpecialAbility,
}: {
  character?: Character
  onCharacterSelect: (character: Character) => void
  availableCharacters: Character[]
  cards: District[]
  coins: number
  onCardSelect: (card: District) => void
  onSpecialAbility?: () => void
}) {
  const [isCharacterSelectOpen, setIsCharacterSelectOpen] = useState(false)
  const [isHandCardsOpen, setIsHandCardsOpen] = useState(false)

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

      <HandCardsList
        cards={cards}
        coins={coins}
        onSelect={(card) => {
          onCardSelect(card)
          setIsHandCardsOpen(false)
        }}
        isExpanded={isHandCardsOpen}
      />

      <div className="player-hand">
        <div className="action-buttons">
          <div>
            <button
              className={`action-button ${isCharacterSelectOpen ? "expanded" : ""}`}
              onClick={() => {
                setIsCharacterSelectOpen(!isCharacterSelectOpen)
                setIsHandCardsOpen(false)
              }}
              aria-label={
                isCharacterSelectOpen ? "Hide characters" : "Select character"
              }
            >
              {character?.icon || "👤"}
            </button>
            <div className="action-button-label">Character</div>
          </div>

          <div>
            <button
              className={`action-button ${isHandCardsOpen ? "expanded" : ""}`}
              onClick={() => {
                setIsHandCardsOpen(!isHandCardsOpen)
                setIsCharacterSelectOpen(false)
              }}
              aria-label={isHandCardsOpen ? "Hide cards" : "Show cards"}
            >
              📜
            </button>
            <div className="action-button-label">Cards ({cards.length})</div>
          </div>

          <button
            className="action-button special-ability"
            onClick={() => onSpecialAbility?.()}
            disabled={!character || !onSpecialAbility}
            title={
              character
                ? getCharacterAbilityDescription(character)
                : "Select a character first"
            }
          >
            <span className="ability-icon">{character?.icon}</span>
            Use Ability
          </button>
        </div>
      </div>
    </>
  )
}

// Get character ability description
function getCharacterAbilityDescription(character: Character): string {
  switch (character.name) {
    case "Assassin":
      return "Kill another character"
    case "Thief":
      return "Steal coins from another character"
    case "Magician":
      return "Exchange cards with another player or the deck"
    case "King":
      return "Take crown and 1 gold for each noble district"
    case "Bishop":
      return "Protect districts and 1 gold for each religious district"
    case "Merchant":
      return "Get 1 extra gold and 1 gold for each trade district"
    case "Architect":
      return "Draw 2 extra cards"
    case "Warlord":
      return "Destroy a district and 1 gold for each military district"
    default:
      return "No special ability"
  }
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

  // Handle special ability use
  const handleSpecialAbility = () => {
    if (yourPlayerId) {
      Rune.actions.useCharacterAbility()
    }
  }

  // Handle card selection
  const handleCardSelect = (district: District) => {
    if (yourPlayerId) {
      Rune.actions.playDistrict(district.id)
    }
  }

  // Update player slots
  const playerSlots = Array(MAX_PLAYERS)
    .fill(null)
    .map((_, index) => {
      const playerId = game.playerIds[index]
      if (!playerId) {
        return { coins: 0, isCurrentPlayer: false } as PlayerBoardProps
      }

      const playerState = game.playerStates[playerId]
      const isCurrentPlayer = playerId === yourPlayerId

      return {
        playerId,
        coins: playerState?.coins || 0,
        character: playerState?.character,
        city: playerState?.city || [],
        isCurrentPlayer,
      } as PlayerBoardProps
    })
    .sort((a, b) => {
      if (a.isCurrentPlayer) return 1
      if (b.isCurrentPlayer) return -1
      return 0
    })

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
          character={currentPlayerState?.character}
          onCharacterSelect={handleCharacterSelect}
          availableCharacters={availableCharacters}
          cards={currentPlayerState?.hand || []}
          coins={currentPlayerState?.coins || 0}
          onCardSelect={handleCardSelect}
          onSpecialAbility={handleSpecialAbility}
        />
      </div>
    </div>
  )
}

export default App
