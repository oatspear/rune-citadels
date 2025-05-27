import type { Character, District, TargetSelectionState } from "../logic"
import type { PlayerId } from "rune-sdk"
import { useState } from "react"

interface CharacterTargetOverlayProps {
  targetSelection: TargetSelectionState
  players: Array<{
    playerId: PlayerId
    character?: Character
    districts?: District[]
  }>
  onSelect: (
    characterId: number,
    districtId?: string,
    selectedCardIds?: string[]
  ) => void
  onCancel: () => void
  currentCharacter: Character | null
  assassinatedCharacterId?: number
  currentHand?: District[] // Add current hand for card selection
}

export function CharacterTargetOverlay({
  targetSelection,
  players,
  onSelect,
  onCancel,
  currentCharacter,
  assassinatedCharacterId,
  currentHand = [], // Add default empty array
}: CharacterTargetOverlayProps) {
  const [selectedCards, setSelectedCards] = useState<District[]>([])

  const getTitle = () => {
    switch (targetSelection.type) {
      case "assassin":
        return "Select a character to assassinate"
      case "thief":
        return "Select a character to steal from"
      case "magician":
        return selectedCards.length > 0
          ? `Return ${selectedCards.length} card(s) to draw same number from deck`
          : "Exchange your hand with another player or select cards to exchange with deck"
      case "warlord":
        return "Select a district to destroy"
      default:
        return "Select a target"
    }
  }

  const isValidTarget = (character: Character) => {
    if (!character || !currentCharacter) return false

    switch (targetSelection.type) {
      case "assassin":
        // Cannot assassinate yourself
        return character.id !== currentCharacter.id
      case "thief":
        // Cannot steal from yourself or the Assassin
        return character.id !== currentCharacter.id && character.id !== 1
      case "magician":
        // Cannot exchange with yourself
        return character.id !== currentCharacter.id
      case "warlord":
        // Districts are handled separately
        return false
      default:
        return false
    }
  }

  const getValidDistricts = () => {
    if (targetSelection.type !== "warlord") return []

    // Get all valid target districts (excluding completed cities and protected Bishop's districts)
    const validTargets = players
      .filter(
        (p) =>
          // Can target Bishop's districts if Bishop was assassinated
          p.character?.id !== 5 || assassinatedCharacterId === 5
      )
      .filter((p) => (p.districts?.length ?? 0) < 7) // Can't target completed cities
      .flatMap((p) =>
        (p.districts || []).map((d) => ({
          ...d,
          playerId: p.playerId,
        }))
      )

    // If there are no valid targets, disable ability
    if (validTargets.length === 0) return []

    return validTargets
  }

  const availableCharacters = players
    .map((p) => p.character)
    .filter((c): c is Character => c !== undefined)
    .filter(isValidTarget)

  const availableDistricts = getValidDistricts()

  const handleCardSelect = (card: District) => {
    setSelectedCards((current) => {
      const index = current.findIndex((c) => c.id === card.id)
      if (index >= 0) {
        // Remove card if already selected
        return current.filter((c) => c.id !== card.id)
      } else {
        // Add card if not already selected
        return [...current, card]
      }
    })
  }

  const renderContent = () => {
    if (targetSelection.type === "magician") {
      return (
        <>
          {/* Player options */}
          <div className="target-section">
            <h4>Exchange with Player:</h4>
            <div className="character-options">
              {players.map((player) => {
                const playerInfo = Rune.getPlayerInfo(player.playerId)
                return (
                  <div
                    key={player.playerId}
                    className="character-option"
                    onClick={() => {
                      setSelectedCards([]) // Clear selections
                      onSelect(Number(player.playerId))
                    }}
                  >
                    <img
                      src={playerInfo?.avatarUrl}
                      className="player-avatar"
                      alt={playerInfo?.displayName || "Unknown player"}
                    />
                    <span className="player-name">
                      {playerInfo?.displayName || "Unknown player"}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Deck interaction */}
          <div className="target-section">
            <h4>Or Exchange with Deck:</h4>
            <div className="hand-cards">
              {currentHand.map((card) => (
                <div
                  key={card.id}
                  className={`district ${card.type} ${
                    selectedCards.some((c) => c.id === card.id)
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => handleCardSelect(card)}
                  title={`${card.name} (${card.cost}) - Click to ${
                    selectedCards.some((c) => c.id === card.id)
                      ? "unselect"
                      : "select"
                  }`}
                >
                  <div className="district-cost">{card.cost}</div>
                  <div className="district-name">{card.name}</div>
                  <div className="district-type">{card.type}</div>
                </div>
              ))}
            </div>
            {selectedCards.length > 0 && (
              <button
                className="confirm-button"
                onClick={() =>
                  onSelect(
                    0,
                    undefined,
                    selectedCards.map((c) => c.id)
                  )
                }
              >
                Confirm Exchange ({selectedCards.length} cards)
              </button>
            )}
          </div>
        </>
      )
    }

    if (targetSelection.type === "warlord") {
      return availableDistricts.map((district) => {
        const playerInfo = Rune.getPlayerInfo(district.playerId)
        const ownerName = playerInfo?.displayName || "Unknown Player"
        return (
          <div
            key={`${district.playerId}-${district.id}`}
            className={`district ${district.type} with-owner`}
            onClick={() => onSelect(0, district.id)}
            title={`${district.name} (${district.cost}) - Owned by ${ownerName}`}
          >
            <div className="district-cost">{district.cost}</div>
            <div className="district-name">{district.name}</div>
            <div className="district-type">{district.type}</div>
            <div className="district-owner">{ownerName}</div>
          </div>
        )
      })
    }

    return availableCharacters.map((character) => (
      <div
        key={character.id}
        className="character-option"
        onClick={() => onSelect(character.id)}
      >
        <span className="character-icon">{character.icon}</span>
        <span className="character-name">{character.name}</span>
      </div>
    ))
  }

  return (
    <div
      className={`character-target-overlay ${
        targetSelection.active ? "expanded" : ""
      }`}
    >
      <h3 className="target-title">{getTitle()}</h3>
      <div className="character-target-grid">{renderContent()}</div>
      <button className="cancel-button" onClick={onCancel}>
        Cancel
      </button>
    </div>
  )
}
