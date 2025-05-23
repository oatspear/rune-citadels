import type { Character, District, TargetSelectionState } from "../logic"
import type { PlayerId } from "rune-sdk"

interface CharacterTargetOverlayProps {
  targetSelection: TargetSelectionState
  players: Array<{
    playerId: PlayerId
    character?: Character
    districts?: District[]
  }>
  onSelect: (characterId: number, districtId?: string) => void
  onCancel: () => void
  currentCharacter: Character | null
}

export function CharacterTargetOverlay({
  targetSelection,
  players,
  onSelect,
  onCancel,
  currentCharacter,
}: CharacterTargetOverlayProps) {
  const getTitle = () => {
    switch (targetSelection.type) {
      case "assassin":
        return "Select a character to assassinate"
      case "thief":
        return "Select a character to steal from"
      case "magician":
        return "Select a character to exchange hands with"
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

    return players
      .filter((p) => p.character?.id !== 5) // Can't target Bishop's districts
      .flatMap((p) =>
        (p.districts || []).map((d) => ({
          ...d,
          playerId: p.playerId,
        }))
      )
  }

  const availableCharacters = players
    .map((p) => p.character)
    .filter((c): c is Character => c !== undefined)
    .filter(isValidTarget)

  const availableDistricts = getValidDistricts()

  const renderContent = () => {
    if (targetSelection.type === "warlord") {
      return availableDistricts.map((district) => (
        <div
          key={`${district.playerId}-${district.id}`}
          className={`district ${district.type}`}
          onClick={() => onSelect(0, district.id)}
        >
          <div className="district-cost">{district.cost}</div>
          <div className="district-name">{district.name}</div>
          <div className="district-type">{district.type}</div>
        </div>
      ))
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
