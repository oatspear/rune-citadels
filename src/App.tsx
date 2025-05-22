import { useEffect, useState } from "react"
import type { PlayerId } from "rune-sdk"
import type { GameState, Character, District } from "./logic"
import { CharacterTargetOverlay } from "./components/CharacterTargetOverlay"

// Constants
const MAX_PLAYERS = 4

// Component interfaces and implementations
interface PlayerBoardProps {
  playerId?: string
  coins: number
  character?: Character
  isCurrentPlayer: boolean
  city?: District[]
  hasCrown: boolean
  isCurrentTurn: boolean
  isCharacterSelector?: boolean
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
  hasCrown,
  isCurrentTurn,
  isCharacterSelector,
}: PlayerBoardProps) {
  const playerInfo = playerId ? Rune.getPlayerInfo(playerId) : null

  return (
    <div
      className={`player-board ${isCurrentPlayer ? "current-player" : ""} ${
        isCurrentTurn ? "current-turn" : ""
      } ${isCharacterSelector ? "character-selector" : ""}`}
    >
      <div className="player-board-header">
        {playerInfo ? (
          <img src={playerInfo.avatarUrl} className="player-avatar" />
        ) : (
          <div className="player-avatar empty">?</div>
        )}
        <span className="player-name">
          {playerInfo ? playerInfo.displayName : "Waiting for player..."}
          {hasCrown && <span className="crown-indicator">👑</span>}
          {isCurrentTurn && <span className="turn-indicator">🎯</span>}
          {isCharacterSelector && (
            <span className="selector-indicator">🎭</span>
          )}
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
  phase: "CHARACTER_SELECTION" | "PLAY_TURNS"
  character?: Character
}

function HandCardsList({
  cards,
  coins,
  onSelect,
  isExpanded,
  phase,
  character,
}: HandCardsListProps) {
  return (
    <div className={`hand-cards-overlay ${isExpanded ? "expanded" : ""}`}>
      <div className="hand-cards-list">
        {cards.map((card) => {
          const canBuild =
            phase === "PLAY_TURNS" && character && coins >= card.cost
          return (
            <div
              key={card.id}
              className={`district ${card.type} ${
                canBuild ? "buildable" : "not-buildable"
              }`}
              onClick={() => canBuild && onSelect(card)}
              title={
                phase !== "PLAY_TURNS"
                  ? "Wait for character selection to complete"
                  : !character
                    ? "Select a character first"
                    : coins >= card.cost
                      ? `Build ${card.name} (${card.cost} coins)`
                      : `Not enough coins to build ${card.name} (need ${card.cost})`
              }
            >
              <div className="district-cost">{card.cost}</div>
              <div className="district-name">{card.name}</div>
              <div className="district-type">{card.type}</div>
            </div>
          )
        })}
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
  disabled,
  phase,
  isCharacterSelector, // Add this prop
}: {
  character?: Character
  onCharacterSelect: (character: Character) => void
  availableCharacters: Character[]
  cards: District[]
  coins: number
  onCardSelect?: (card: District) => void
  onSpecialAbility?: () => void
  disabled?: boolean
  phase: "CHARACTER_SELECTION" | "PLAY_TURNS"
  isCharacterSelector?: boolean // Add this prop
}) {
  const [isCharacterSelectOpen, setIsCharacterSelectOpen] = useState(false)
  const [isHandCardsOpen, setIsHandCardsOpen] = useState(false)

  // Helper to determine if character selection is allowed
  const canSelectCharacter =
    phase === "CHARACTER_SELECTION" && isCharacterSelector && !character

  return (
    <>
      <CharacterSelect
        characters={availableCharacters}
        onSelect={(char) => {
          // Only allow selection if it's the player's turn
          if (canSelectCharacter) {
            onCharacterSelect(char)
            setIsCharacterSelectOpen(false)
          }
        }}
        isExpanded={isCharacterSelectOpen}
      />

      <HandCardsList
        cards={cards}
        coins={coins}
        onSelect={(card) => {
          // Only allow card selection if player has a character and it's play turn phase
          if (onCardSelect && character && phase === "PLAY_TURNS") {
            onCardSelect(card)
          }
          setIsHandCardsOpen(false)
        }}
        isExpanded={isHandCardsOpen}
        phase={phase}
        character={character}
      />

      <div className="player-hand">
        <div className="action-buttons">
          <div>
            <button
              className={`action-button ${isCharacterSelectOpen ? "expanded" : ""}`}
              onClick={() => {
                // Only toggle if selection is allowed
                if (canSelectCharacter) {
                  setIsCharacterSelectOpen(!isCharacterSelectOpen)
                  setIsHandCardsOpen(false)
                }
              }}
              aria-label={
                isCharacterSelectOpen ? "Hide characters" : "Select character"
              }
              disabled={!canSelectCharacter}
              title={
                !phase
                  ? "Game not started"
                  : phase !== "CHARACTER_SELECTION"
                    ? "Not character selection phase"
                    : !isCharacterSelector
                      ? "Not your turn to select"
                      : character
                        ? "Already selected character"
                        : "Select your character"
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
              // Remove the disabled prop so players can always view their cards
            >
              📜
            </button>
            <div className="action-button-label">Cards ({cards.length})</div>
          </div>

          <button
            className="action-button special-ability"
            onClick={() => onSpecialAbility?.()}
            disabled={
              !character ||
              !onSpecialAbility ||
              disabled ||
              phase !== "PLAY_TURNS"
            }
            title={
              disabled
                ? "Not your turn"
                : character
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

function App() {
  const [game, setGame] = useState<GameState>()
  const [yourPlayerId, setYourPlayerId] = useState<PlayerId>()

  useEffect(() => {
    Rune.initClient({
      onChange: (params) => {
        setGame(params.game)
        setYourPlayerId(params.yourPlayerId)
      },
    })
  }, [])

  // Handlers for game actions
  const handleCardSelect = (district: District) => {
    if (!yourPlayerId || !game) return
    Rune.actions.playDistrict({ districtId: district.id })
  }

  const handleCharacterSelect = (character: Character) => {
    if (!yourPlayerId || !game) return
    if (game.turnPhase === "CHARACTER_SELECTION") {
      Rune.actions.selectCharacter({ characterId: character.id })
    }
  }

  const handleSpecialAbility = () => {
    if (!yourPlayerId || !game) return
    Rune.actions.useCharacterAbility(null)
  }

  const handleCharacterTargetCancel = () => {
    if (!yourPlayerId || !game?.targetSelection?.active) return
    Rune.actions.useCharacterAbility(null)
  }

  // Helper functions
  const getCharacterSelectionOrder = (game: GameState): PlayerId[] => {
    const crownPlayer = game.crownHolder
    if (!crownPlayer) return game.playerIds
    const orderedPlayers = game.playerIds.filter((id) => id !== crownPlayer)
    return [crownPlayer, ...orderedPlayers]
  }

  const getPlayerCharacters = () => {
    if (!game) return []
    return game.playerIds.map((playerId) => ({
      playerId,
      character: game.playerStates[playerId].character,
    }))
  }

  const getCurrentCharacter = () => {
    if (!game || !yourPlayerId) return null
    return game.playerStates[yourPlayerId].character || null
  }

  const isPlayerTurn = (playerId: PlayerId): boolean => {
    if (!game || !playerId) return false

    if (game.turnPhase === "CHARACTER_SELECTION") {
      // Get players in selection order
      const selectionOrder = getCharacterSelectionOrder(game)
      // Find first player who hasn't selected a character yet
      const currentSelector = selectionOrder.find(
        (id) => !game.playerStates[id].character
      )
      return playerId === currentSelector
    }

    const playerState = game.playerStates[playerId]
    if (!playerState?.character) return false

    return (
      playerState.character.id === game.currentCharacterId &&
      playerState.character.id !== game.assassinatedCharacterId
    )
  }

  const getCurrentTurnPlayerId = (): PlayerId | undefined => {
    if (!game) return undefined

    return Object.entries(game.playerStates).find(
      ([, state]) => state.character?.id === game.currentCharacterId
    )?.[0]
  }

  if (!game) return null

  // Get available characters (not taken by other players)
  const takenCharacterIds = new Set(
    Object.values(game.playerStates)
      .map((state) => state.character?.id)
      .filter(Boolean)
  )

  const availableCharacters = characters.filter(
    (c) => !takenCharacterIds.has(c.id)
  )

  // Update player slots
  const playerSlots = Array(MAX_PLAYERS)
    .fill(null)
    .map((_, index) => {
      const playerId = game.playerIds[index]
      if (!playerId) {
        return {
          coins: 0,
          isCurrentPlayer: false,
          hasCrown: false,
          city: [],
          isCurrentTurn: false,
          isCharacterSelector: false,
        } as PlayerBoardProps
      }

      const playerState = game.playerStates[playerId]
      const isCurrentPlayer = playerId === yourPlayerId
      const currentSelector =
        game.turnPhase === "CHARACTER_SELECTION" &&
        getCharacterSelectionOrder(game).find(
          (id) => !game.playerStates[id].character
        )

      return {
        playerId,
        coins: playerState?.coins || 0,
        character: playerState?.character,
        city: playerState?.city || [],
        isCurrentPlayer,
        hasCrown: playerId === game.crownHolder,
        isCurrentTurn: playerId === getCurrentTurnPlayerId(),
        isCharacterSelector: playerId === currentSelector,
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
  const canPlay = isPlayerTurn(yourPlayerId!)

  return (
    <div className="game-container">
      <div className="main-area">
        {game.targetSelection?.active && (
          <CharacterTargetOverlay
            targetSelection={game.targetSelection}
            players={getPlayerCharacters()}
            onSelect={(targetId, districtId) => {
              if (districtId) {
                Rune.actions.useCharacterAbility({
                  targetDistrictId: districtId,
                })
              } else {
                Rune.actions.useCharacterAbility({
                  targetCharacterId: targetId,
                })
              }
            }}
            onCancel={handleCharacterTargetCancel}
            currentCharacter={getCurrentCharacter()}
          />
        )}
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
          onCardSelect={canPlay ? handleCardSelect : undefined}
          onSpecialAbility={canPlay ? handleSpecialAbility : undefined}
          disabled={!canPlay}
          phase={game.turnPhase}
          isCharacterSelector={
            game.turnPhase === "CHARACTER_SELECTION" &&
            getCharacterSelectionOrder(game).find(
              (id) => !game.playerStates[id].character
            ) === yourPlayerId
          }
        />
        {canPlay && (
          <button
            className="end-turn-button"
            onClick={() => Rune.actions.endTurn(null)}
          >
            End Turn
          </button>
        )}
      </div>
    </div>
  )
}

export default App
