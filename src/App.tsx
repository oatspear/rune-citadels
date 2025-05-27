import { useEffect, useState } from "react"
import type { PlayerId } from "rune-sdk"
import type { GameState, Character, District } from "./logic"
import { CHARACTERS, DISTRICTS_TO_WIN } from "./logic"
import { CharacterTargetOverlay } from "./components/CharacterTargetOverlay"
import { CharacterSelect } from "./components/CharacterSelect"
import { CardSelectOverlay } from "./components/CardSelectOverlay"

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
  game: GameState
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
  game,
}: PlayerBoardProps) {
  const playerInfo = playerId ? Rune.getPlayerInfo(playerId) : null
  const isCharacterRevealed =
    (isCurrentPlayer && character) || // Always show current player's character
    (game.turnPhase === "PLAY_TURNS" && // Only reveal during play phase
      character &&
      game.currentCharacterId >= character.id && // Character is revealed when it's their turn or after
      character.id !== game.assassinatedCharacterId) // Unless they were assassinated

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
          <div
            className={`board-character ${!isCharacterRevealed ? "hidden" : ""}`}
          >
            <span className="character-icon small">
              {isCharacterRevealed ? character.icon : "❓"}
            </span>
            {isCharacterRevealed ? character.name : "Unknown"}
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

interface PlayerHandProps {
  character?: Character
  onCharacterSelect: (character: Character) => void
  availableCharacters: Character[]
  cards: District[]
  coins: number
  onCardSelect?: (card: District) => void
  onSpecialAbility?: () => void
  onChooseCoins?: () => void
  onChooseCards?: () => void
  disabled?: boolean
  phase: "CHARACTER_SELECTION" | "PLAY_TURNS"
  isCharacterSelector?: boolean
  game: GameState
  hasChosenResource: boolean
  hasUsedAbility?: boolean
}

function PlayerHand({
  character,
  onCharacterSelect,
  availableCharacters,
  cards,
  coins,
  onCardSelect,
  onSpecialAbility,
  onChooseCoins,
  onChooseCards,
  disabled,
  phase,
  isCharacterSelector,
  game,
  hasChosenResource,
  hasUsedAbility,
}: PlayerHandProps) {
  const [isCharacterSelectOpen, setIsCharacterSelectOpen] = useState(false)
  const [isHandCardsOpen, setIsHandCardsOpen] = useState(false)

  // Helper to determine if character selection is allowed
  const canSelectCharacter =
    phase === "CHARACTER_SELECTION" && isCharacterSelector && !character

  // Helper to determine if card selection is allowed
  const canSelectCards =
    phase === "PLAY_TURNS" && character && !disabled && hasChosenResource

  return (
    <>
      {phase === "PLAY_TURNS" && !disabled && !hasChosenResource && (
        <div className="resource-buttons">
          <button
            className="resource-button"
            onClick={onChooseCoins}
            title="Take 2 gold coins"
          >
            <span className="coin-icon">🪙</span>
            Take Gold
          </button>
          <button
            className="resource-button"
            onClick={onChooseCards}
            title="Draw 2 district cards and keep 1"
          >
            <span>📜</span>
            Draw Cards ({game.deck.length})
          </button>
        </div>
      )}

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
        removedCharacterId={game.removedCharacterId}
        unavailableCharacterId={game.unavailableCharacterId}
      />

      <HandCardsList
        cards={cards}
        coins={coins}
        onSelect={(card) => {
          if (canSelectCards && onCardSelect) {
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
          {canSelectCharacter && (
            <div>
              <button
                className={`action-button ${isCharacterSelectOpen ? "expanded" : ""}`}
                onClick={() => {
                  if (canSelectCharacter) {
                    setIsCharacterSelectOpen(!isCharacterSelectOpen)
                    setIsHandCardsOpen(false)
                  }
                }}
                aria-label={
                  isCharacterSelectOpen ? "Hide characters" : "Select character"
                }
                title="Select your character"
              >
                👤
              </button>
              <div className="action-button-label">Character</div>
            </div>
          )}

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

          {character && (
            <button
              className={`action-button special-ability ${hasUsedAbility ? "used" : ""}`}
              onClick={() => onSpecialAbility?.()}
              disabled={
                !onSpecialAbility ||
                disabled ||
                phase !== "PLAY_TURNS" ||
                hasUsedAbility
              }
              title={
                phase !== "PLAY_TURNS"
                  ? "Wait for character selection to complete"
                  : disabled
                    ? "Not your turn"
                    : hasUsedAbility
                      ? "Ability already used this turn"
                      : getCharacterAbilityDescription(character)
              }
            >
              <span className="ability-icon">{character.icon}</span>
              {hasUsedAbility ? "Ability Used" : "Use Ability"}
            </button>
          )}
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
      return "Exchange your entire hand with another player, or return any cards to bottom of deck to draw an equal number"
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
  const [yourPlayerId, setYourPlayerId] = useState<PlayerId>()
  const [hasChosenResource, setHasChosenResource] = useState(false)
  const [localUIState, setLocalUIState] = useState<{
    type: "assassin" | "thief" | "magician" | "warlord" | "draw_cards"
    active: boolean
    cards?: District[]
  } | null>(null)

  // Reset resource choice when a new turn starts
  useEffect(() => {
    if (game?.currentCharacterId && yourPlayerId) {
      const isMyTurn =
        game.playerStates[yourPlayerId]?.character?.id ===
        game.currentCharacterId
      if (!isMyTurn) {
        setHasChosenResource(false)
      }
    }
  }, [game?.currentCharacterId, game?.playerStates, yourPlayerId])

  useEffect(() => {
    Rune.initClient({
      onChange: ({ game, yourPlayerId }) => {
        setGame(game)
        setYourPlayerId(yourPlayerId)

        // Handle drawn cards overlay
        if (yourPlayerId && game?.playerStates[yourPlayerId]?.drawnCards) {
          setLocalUIState({
            type: "draw_cards",
            active: true,
            cards: game.playerStates[yourPlayerId].drawnCards,
          })
        } else if (localUIState?.type === "draw_cards") {
          setLocalUIState(null)
        }
      },
    })
  }, [localUIState?.type])

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
    const character = game.playerStates[yourPlayerId].character
    if (!character) return

    // Show target selection overlay based on character
    switch (character.name) {
      case "Assassin":
        setLocalUIState({ type: "assassin", active: true })
        break
      case "Thief":
        setLocalUIState({ type: "thief", active: true })
        break
      case "Magician":
        setLocalUIState({ type: "magician", active: true })
        break
      case "Warlord": {
        const warlordState = game.playerStates[yourPlayerId]
        const warlordMilitaryDistricts = warlordState.city.filter(
          (d) => d.type === "military"
        ).length
        const playerCoins = warlordState.coins

        // Find all districts that can be destroyed
        const isDistrictTargetable = (
          district: District,
          ownerId: PlayerId
        ) => {
          const ownerState = game.playerStates[ownerId]
          const ownerCharacter = ownerState.character
          // Can't target if owner is Bishop (unless Bishop was assassinated)
          const isBishopProtected =
            ownerCharacter?.name === "Bishop" &&
            ownerCharacter.id !== game.assassinatedCharacterId
          // Check if we can afford destruction (cost - 1), or if it's free (cost = 1)
          // Also account for coins we'll get from military districts
          const destructionCost = Math.max(0, district.cost - 1)
          const canAffordDestruction =
            playerCoins + warlordMilitaryDistricts >= destructionCost
          // Can't target completed cities (8+ districts)
          const isInCompletedCity = ownerState.city.length >= DISTRICTS_TO_WIN

          return (
            !isBishopProtected && canAffordDestruction && !isInCompletedCity
          )
        }

        // Find all valid targets across all players
        const validTargets = Object.entries(game.playerStates).flatMap(
          ([playerId, state]) =>
            state.city.filter((district) =>
              isDistrictTargetable(district, playerId)
            )
        )

        if (validTargets.length > 0) {
          // Has valid districts to target, show targeting UI
          setLocalUIState({ type: "warlord", active: true })
        } else if (warlordMilitaryDistricts > 0) {
          // No valid targets but has military districts, just get coins
          Rune.actions.useCharacterAbility(null)
        }
        // If no valid targets and no military districts - do nothing
        break
      }
      default:
        // For characters without targeting (King, Bishop, Merchant, Architect)
        Rune.actions.useCharacterAbility(null)
        break
    }
  }

  const handleCharacterTargetCancel = () => {
    setLocalUIState(null)
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

    if (localUIState?.type === "assassin" || localUIState?.type === "thief") {
      // For Assassin/Thief, show all possible target characters
      return CHARACTERS.filter((char) => {
        // Filter based on ability
        if (localUIState.type === "assassin") {
          // Can target characters 2-8, except removed/unavailable
          return (
            char.id > 1 &&
            char.id !== game.removedCharacterId &&
            char.id !== game.unavailableCharacterId
          )
        } else {
          // Thief: can target characters 3-8 except removed/unavailable/assassinated
          return (
            char.id > 2 &&
            char.id !== game.removedCharacterId &&
            char.id !== game.unavailableCharacterId &&
            char.id !== game.assassinatedCharacterId &&
            char.id !== 1 // Never target Assassin
          )
        }
      }).map((char) => ({
        playerId: "", // Empty string as we don't know who has this character
        character: char,
      }))
    }

    if (localUIState?.type === "magician") {
      // For Magician, only show other players (not their characters)
      return game.playerIds
        .filter((id) => id !== yourPlayerId) // Can't target yourself
        .map((playerId) => ({
          playerId,
          // Don't include character to prevent revealing it
        }))
    }

    // For Warlord, use actual player states with districts
    return game.playerIds
      .filter((id) => id !== yourPlayerId) // Filter out self for clarity
      .map((playerId) => ({
        playerId,
        character: game.playerStates[playerId].character,
        districts: game.playerStates[playerId].city,
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

    // Skip assassinated character
    if (game.currentCharacterId === game.assassinatedCharacterId) {
      return undefined
    }

    return Object.entries(game.playerStates).find(
      ([, state]) => state.character?.id === game.currentCharacterId
    )?.[0]
  }

  if (!game) return null

  // Get available characters that haven't been selected
  const takenCharacterIds = new Set(
    Object.values(game.playerStates)
      .map((state) => state.character?.id)
      .filter(Boolean)
  )

  const availableCharacters = game.availableCharacters.filter(
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
          game,
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
        game,
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
      <div className="turn-status-bar">
        {game.turnPhase === "CHARACTER_SELECTION" ? (
          <>
            <span className="character-icon">🎭</span>
            Select Characters
          </>
        ) : (
          game.currentCharacterId && (
            <>
              <span className="character-icon">
                {CHARACTERS.find((c) => c.id === game.currentCharacterId)?.icon}
              </span>
              {CHARACTERS.find((c) => c.id === game.currentCharacterId)?.name}
              &apos;s Turn
            </>
          )
        )}
      </div>
      <div className="main-area">
        {localUIState?.active ? (
          localUIState.type === "draw_cards" ? (
            <CardSelectOverlay
              cards={localUIState.cards ?? []}
              onSelect={(_, index) => {
                Rune.actions.drawCards({ cardIndex: index })
                setLocalUIState(null)
              }}
              active={true}
            />
          ) : (
            <CharacterTargetOverlay
              targetSelection={localUIState}
              players={
                localUIState.type === "assassin" ||
                localUIState.type === "thief"
                  ? // For Assassin/Thief, show valid potential targets
                    CHARACTERS.filter((char) => {
                      if (localUIState.type === "assassin") {
                        // Can target characters 2-8, except removed/unavailable
                        return (
                          char.id > 1 &&
                          char.id !== game.removedCharacterId &&
                          char.id !== game.unavailableCharacterId
                        )
                      } else {
                        // Thief: can target characters 3-8 except removed/unavailable/assassinated
                        return (
                          char.id > 2 &&
                          char.id !== game.removedCharacterId &&
                          char.id !== game.unavailableCharacterId &&
                          char.id !== game.assassinatedCharacterId &&
                          char.id !== 1 // Never target Assassin
                        )
                      }
                    }).map((char) => ({
                      playerId: "", // Empty string as we don't know who has this character
                      character: char,
                    }))
                  : // For other abilities (Warlord, Magician), use actual player states
                    getPlayerCharacters()
              }
              onSelect={(targetId, districtId, selectedCardIds) => {
                if (districtId) {
                  Rune.actions.useCharacterAbility({
                    targetDistrictId: districtId,
                  })
                } else if (typeof targetId === "number") {
                  // Handle character ID targets (Assassin, Thief)
                  Rune.actions.useCharacterAbility({
                    targetCharacterId: targetId,
                    selectedCardIds: selectedCardIds,
                  })
                } else {
                  // Handle Magician's player ID or deck targets
                  Rune.actions.useCharacterAbility({
                    targetCharacterId: targetId, // PlayerId or "0" for deck
                    selectedCardIds: selectedCardIds,
                  })
                }
                setLocalUIState(null)
              }}
              onCancel={handleCharacterTargetCancel}
              currentCharacter={getCurrentCharacter()}
            />
          )
        ) : null}
        <div className="game-boards">
          {playerSlots.map((player, index) => (
            <PlayerBoard key={index} {...player} />
          ))}
        </div>
      </div>
      <div className={`bottom-area ${canPlay ? "your-turn" : ""}`}>
        <PlayerHand
          character={currentPlayerState?.character}
          onCharacterSelect={handleCharacterSelect}
          availableCharacters={availableCharacters}
          cards={currentPlayerState?.hand || []}
          coins={currentPlayerState?.coins || 0}
          onCardSelect={
            canPlay && hasChosenResource ? handleCardSelect : undefined
          }
          onSpecialAbility={canPlay ? handleSpecialAbility : undefined}
          hasUsedAbility={currentPlayerState?.hasUsedAbility}
          onChooseCoins={() => {
            Rune.actions.takeCoins(null)
            setHasChosenResource(true)
          }}
          onChooseCards={() => {
            // Initiate the card drawing process by calling the action with no cardIndex
            Rune.actions.drawCards({})
            setHasChosenResource(true)
          }}
          disabled={!canPlay}
          phase={game.turnPhase}
          isCharacterSelector={
            game.turnPhase === "CHARACTER_SELECTION" &&
            getCharacterSelectionOrder(game).find(
              (id) => !game.playerStates[id].character
            ) === yourPlayerId
          }
          game={game}
          hasChosenResource={hasChosenResource}
        />
        {canPlay && game.turnPhase === "PLAY_TURNS" && hasChosenResource && (
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
