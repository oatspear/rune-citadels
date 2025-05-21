import type { PlayerId, RuneClient } from "rune-sdk"

export type Cells = (PlayerId | null)[]
export interface GameState {
  playerIds: PlayerId[]
  playerStates: {
    [key: string]: {
      coins: number
      character?: Character
    }
  }
}

export interface Character {
  id: number
  name: string
  icon: string
}

// List of available characters
const CHARACTERS: Character[] = [
  { id: 1, name: "Assassin", icon: "🗡️" },
  { id: 2, name: "Thief", icon: "🦹" },
  { id: 3, name: "Magician", icon: "🧙" },
  { id: 4, name: "King", icon: "👑" },
  { id: 5, name: "Bishop", icon: "⛪" },
  { id: 6, name: "Merchant", icon: "💰" },
  { id: 7, name: "Architect", icon: "🏗️" },
  { id: 8, name: "Warlord", icon: "⚔️" },
]

type GameActions = {
  takeCoins: () => void
  selectCharacter: (characterId: number) => void
}

declare global {
  const Rune: RuneClient<GameState, GameActions>
}

Rune.initLogic({
  minPlayers: 2,
  maxPlayers: 6,
  setup: (allPlayerIds) => ({
    playerIds: allPlayerIds,
    playerStates: Object.fromEntries(
      allPlayerIds.map((id) => [id, { coins: 2 }])
    ),
  }),
  actions: {
    takeCoins: (_payload, { game, playerId, allPlayerIds }) => {
      if (playerId !== allPlayerIds[0]) {
        throw Rune.invalidAction()
      }

      if (game.playerIds.length === 10) {
        Rune.gameOver({
          players: {
            [game.playerIds[0]]: "LOST",
            [game.playerIds[1]]: "LOST",
          },
        })
      }
    },
    selectCharacter: (characterId, { game, playerId }) => {
      // Validate character selection
      const character = CHARACTERS.find((c) => c.id === characterId)
      if (!character) {
        throw Rune.invalidAction()
      }

      // Check if character is already taken
      const isCharacterTaken = Object.values(game.playerStates).some(
        (state) => state.character?.id === characterId
      )
      if (isCharacterTaken) {
        throw Rune.invalidAction()
      }

      // Assign character to player
      game.playerStates[playerId].character = character
    },
  },
})
