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

type GameActions = {
  takeCoins: () => void
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
  },
})
