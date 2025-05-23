import { Character } from "../logic"

interface CharacterSelectProps {
  characters: Character[]
  onSelect: (character: Character) => void
  isExpanded: boolean
  removedCharacterId?: number
  unavailableCharacterId?: number
}

export function CharacterSelect({
  characters,
  onSelect,
  isExpanded,
  removedCharacterId,
  unavailableCharacterId,
}: CharacterSelectProps) {
  return (
    <div className={`character-select-overlay ${isExpanded ? "expanded" : ""}`}>
      <div className="character-grid">
        {characters.map((character) => {
          const isAvailable = characters.some((c) => c.id === character.id)
          const isRemoved = character.id === removedCharacterId
          const isUnavailable = character.id === unavailableCharacterId
          
          return (
            <div
              key={character.id}
              className={`character-option ${isRemoved ? "removed" : ""} ${
                isUnavailable ? "unavailable" : ""
              } ${!isAvailable ? "taken" : ""}`}
              onClick={() => isAvailable && !isRemoved && !isUnavailable && onSelect(character)}
              title={
                isAvailable && !isRemoved && !isUnavailable
                  ? `Select ${character.name}`
                  : "This character is not available for selection"
              }
            >
              <span className="character-icon">{character.icon}</span>
              <span className="character-name">
                {character.name}
                {(!isAvailable || isRemoved || isUnavailable) && (
                  <span className="character-status"> (Not Available)</span>
                )}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}