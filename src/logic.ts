import type { PlayerId, RuneClient } from "rune-sdk"

// Type definitions for the game state
export interface TargetSelectionState {
  type: "assassin" | "thief" | "magician" | "warlord"
  active: boolean
}

export interface Character {
  id: number
  name: string
  icon: string
}

export interface District {
  id: string
  name: string
  type: "noble" | "religious" | "trade" | "military" | "unique"
  cost: number
}

export interface GameState {
  playerIds: PlayerId[]
  playerStates: {
    [key: string]: {
      coins: number
      character?: Character
      hand: District[]
      city: District[]
    }
  }
  deck: District[]
  currentCharacterId: number
  turnPhase: "CHARACTER_SELECTION" | "PLAY_TURNS"
  crownHolder?: PlayerId
  lastTurnChange?: number // Timestamp when turn last changed
  assassinatedCharacterId?: number
  stolenCharacterId?: number
  targetSelection?: TargetSelectionState
}

// Action payloads
interface ActionPayloads {
  takeCoins: null
  selectCharacter: { characterId: number }
  useCharacterAbility: {
    targetCharacterId?: number
    targetDistrictId?: string
  } | null
  playDistrict: { districtId: string }
  drawCards: { keep: number }
  endTurn: null
}

// Game actions type that satisfies Rune's requirements
export type GameActions = {
  [K in keyof ActionPayloads]: (payload: ActionPayloads[K]) => void
}

// Available characters
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

// District cards
const DISTRICTS: District[] = [
  // Noble districts
  { id: "palace", name: "Palace", type: "noble", cost: 5 },
  { id: "castle", name: "Castle", type: "noble", cost: 4 },
  { id: "manor", name: "Manor", type: "noble", cost: 3 },

  // Religious districts
  { id: "temple", name: "Temple", type: "religious", cost: 2 },
  { id: "church", name: "Church", type: "religious", cost: 3 },
  { id: "monastery", name: "Monastery", type: "religious", cost: 3 },
  { id: "cathedral", name: "Cathedral", type: "religious", cost: 5 },

  // Trade districts
  { id: "tavern", name: "Tavern", type: "trade", cost: 1 },
  { id: "market", name: "Market", type: "trade", cost: 2 },
  { id: "trading_post", name: "Trading Post", type: "trade", cost: 2 },
  { id: "harbor", name: "Harbor", type: "trade", cost: 4 },

  // Military districts
  { id: "watchtower", name: "Watchtower", type: "military", cost: 1 },
  { id: "prison", name: "Prison", type: "military", cost: 2 },
  { id: "barracks", name: "Barracks", type: "military", cost: 3 },
  { id: "fortress", name: "Fortress", type: "military", cost: 5 },
]

// Constants
const TURN_AUTO_ADVANCE_MS = 3000 // 3 seconds in milliseconds

// Helper functions
function shuffle<T>(array: T[]): T[] {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function isPlayerTurn(game: GameState, playerId: PlayerId): boolean {
  if (game.turnPhase === "CHARACTER_SELECTION") {
    // During character selection, crown holder goes first, then clockwise
    // TODO: Implement proper character selection order
    return true
  }

  const playerState = game.playerStates[playerId]
  if (!playerState?.character) return false

  return (
    playerState.character.id === game.currentCharacterId &&
    playerState.character.id !== game.assassinatedCharacterId
  )
}

function advanceToNextCharacter(game: GameState): void {
  game.currentCharacterId++
  if (game.currentCharacterId > 8) {
    game.currentCharacterId = 1
    game.turnPhase = "CHARACTER_SELECTION"
    game.assassinatedCharacterId = undefined
    game.stolenCharacterId = undefined
    Object.values(game.playerStates).forEach((state) => {
      state.character = undefined
    })
  }
  game.lastTurnChange = Rune.gameTime()
}

// Helper to check if any player has the given character
function hasPlayerWithCharacter(game: GameState, characterId: number): boolean {
  return Object.values(game.playerStates).some(
    (state) => state.character?.id === characterId
  )
}

// Define Rune client type globally
declare global {
  const Rune: RuneClient<GameState, GameActions>
}

// Initialize game logic
Rune.initLogic({
  minPlayers: 2,
  maxPlayers: 4,
  setup: (allPlayerIds: PlayerId[]): GameState => {
    // Shuffle the deck
    const shuffledDeck = shuffle([...DISTRICTS])

    // Deal 4 cards to each player
    const playerStates = Object.fromEntries(
      allPlayerIds.map((id) => {
        const hand = shuffledDeck.splice(0, 4)
        return [id, { coins: 2, hand, city: [] }]
      })
    )

    // Randomly assign the crown
    const crownHolder =
      allPlayerIds[Math.floor(Math.random() * allPlayerIds.length)]

    return {
      playerIds: allPlayerIds,
      playerStates,
      deck: shuffledDeck,
      currentCharacterId: 1,
      turnPhase: "CHARACTER_SELECTION",
      crownHolder,
      lastTurnChange: Rune.gameTime(),
      assassinatedCharacterId: undefined,
      stolenCharacterId: undefined,
    }
  },
  actions: {
    takeCoins: (_payload: null, { game, playerId }): void => {
      if (!isPlayerTurn(game, playerId)) throw Rune.invalidAction()
      game.playerStates[playerId].coins += 2
    },

    selectCharacter: (
      { characterId }: { characterId: number },
      { game, playerId }
    ): void => {
      if (game.turnPhase !== "CHARACTER_SELECTION") throw Rune.invalidAction()

      const character = CHARACTERS.find((c) => c.id === characterId)
      if (!character) throw Rune.invalidAction()

      const isCharacterTaken = Object.values(game.playerStates).some(
        (state) => state.character?.id === characterId
      )
      if (isCharacterTaken) throw Rune.invalidAction()

      game.playerStates[playerId].character = character

      const allPlayersHaveCharacters = game.playerIds.every(
        (id) => game.playerStates[id].character
      )
      if (allPlayersHaveCharacters) {
        game.turnPhase = "PLAY_TURNS"
        game.lastTurnChange = Rune.gameTime()
      }
    },

    useCharacterAbility: (
      payload: ActionPayloads["useCharacterAbility"],
      { game, playerId }
    ): void => {
      if (!isPlayerTurn(game, playerId)) throw Rune.invalidAction()

      const playerState = game.playerStates[playerId]
      if (!playerState?.character) throw Rune.invalidAction()

      switch (playerState.character.name) {
        case "Assassin": {
          if (payload?.targetCharacterId) {
            game.assassinatedCharacterId = payload.targetCharacterId
            game.targetSelection = undefined
          } else {
            game.targetSelection = {
              type: "assassin",
              active: true,
            }
          }
          break
        }

        case "Thief": {
          if (payload?.targetCharacterId) {
            game.stolenCharacterId = payload.targetCharacterId
            game.targetSelection = undefined
          } else {
            game.targetSelection = {
              type: "thief",
              active: true,
            }
          }
          break
        }

        case "Magician": {
          if (payload?.targetCharacterId) {
            const targetState = Object.values(game.playerStates).find(
              (state) => state.character?.id === payload.targetCharacterId
            )
            if (targetState) {
              const tempHand = playerState.hand
              playerState.hand = targetState.hand
              targetState.hand = tempHand
            }
            game.targetSelection = undefined
          } else {
            game.targetSelection = {
              type: "magician",
              active: true,
            }
          }
          break
        }

        case "King": {
          game.crownHolder = playerId
          const nobleDistrictCount = playerState.city.filter(
            (d) => d.type === "noble"
          ).length
          playerState.coins += nobleDistrictCount
          break
        }

        case "Bishop": {
          const religiousDistrictCount = playerState.city.filter(
            (d) => d.type === "religious"
          ).length
          playerState.coins += religiousDistrictCount
          break
        }

        case "Merchant": {
          playerState.coins += 1
          const tradeDistrictCount = playerState.city.filter(
            (d) => d.type === "trade"
          ).length
          playerState.coins += tradeDistrictCount
          break
        }

        case "Architect": {
          const drawCount = Math.min(2, game.deck.length)
          const drawnCards = game.deck.splice(0, drawCount)
          playerState.hand.push(...drawnCards)
          break
        }

        case "Warlord": {
          if (payload?.targetDistrictId) {
            for (const [pid, pState] of Object.entries(game.playerStates)) {
              const districtIndex = pState.city.findIndex(
                (d) => d.id === payload.targetDistrictId
              )
              if (districtIndex >= 0) {
                const [district] = pState.city.splice(districtIndex, 1)
                game.playerStates[pid].coins += Math.floor(district.cost / 2)
                break
              }
            }
            game.targetSelection = undefined
          } else {
            const militaryDistrictCount = playerState.city.filter(
              (d) => d.type === "military"
            ).length
            playerState.coins += militaryDistrictCount
            game.targetSelection = {
              type: "warlord",
              active: true,
            }
          }
          break
        }
      }
    },

    playDistrict: (
      { districtId }: { districtId: string },
      { game, playerId }
    ): void => {
      if (!isPlayerTurn(game, playerId)) throw Rune.invalidAction()

      const playerState = game.playerStates[playerId]
      const district = playerState.hand.find((d) => d.id === districtId)
      if (!district) throw Rune.invalidAction()
      if (playerState.coins < district.cost) throw Rune.invalidAction()

      playerState.coins -= district.cost
      playerState.city.push(district)
      playerState.hand = playerState.hand.filter((d) => d.id !== districtId)
    },

    drawCards: ({ keep }: { keep: number }, { game, playerId }): void => {
      if (!isPlayerTurn(game, playerId)) throw Rune.invalidAction()

      const playerState = game.playerStates[playerId]
      const drawCount = Math.min(keep, game.deck.length)
      const drawnCards = game.deck.splice(0, drawCount)
      playerState.hand.push(...drawnCards)
    },

    endTurn: (_payload: null, { game, playerId }): void => {
      if (!isPlayerTurn(game, playerId)) throw Rune.invalidAction()
      advanceToNextCharacter(game)
    },
  },

  update: ({ game }): void => {
    // Only run updates during PLAY_TURNS phase
    if (game.turnPhase !== "PLAY_TURNS") return

    // Skip if no current character (shouldn't happen, but just in case)
    if (!game.currentCharacterId) return

    // Skip if current character is assassinated (wait for manual advancement)
    if (game.currentCharacterId === game.assassinatedCharacterId) return

    // Skip if any player has the current character
    if (hasPlayerWithCharacter(game, game.currentCharacterId)) return

    // Check if enough time has passed since the last turn change
    const timeSinceChange = Rune.gameTime() - (game.lastTurnChange || 0)
    if (timeSinceChange >= TURN_AUTO_ADVANCE_MS) {
      game.lastTurnChange = Rune.gameTime()
      advanceToNextCharacter(game)
    }
  },
})
