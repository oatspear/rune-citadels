import type { PlayerId, RuneClient } from "rune-sdk"

// Type definitions for the game state
export interface TargetSelectionState {
  type: "assassin" | "thief" | "magician" | "warlord" | "draw_cards"
  active: boolean
  cards?: District[] // For storing drawn cards during card selection
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
      districtsPlayedThisTurn: number
      hasUsedAbility: boolean
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
  availableCharacters: Character[] // Add this field for available character tracking
  removedCharacterId?: number // Track removed character
  unavailableCharacterId?: number // Track marked unavailable character
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
  drawCards: { cardIndex?: number }
  endTurn: null
}

// Game actions type that satisfies Rune's requirements
export type GameActions = {
  [K in keyof ActionPayloads]: (payload: ActionPayloads[K]) => void
}

// Available characters
export const CHARACTERS: Character[] = [
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
const DISTRICTS_TO_WIN = 7

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

  // Never allow actions from assassinated characters
  if (playerState.character.id === game.assassinatedCharacterId) return false

  return playerState.character.id === game.currentCharacterId
}

function advanceToNextCharacter(game: GameState): void {
  // Reset districts played and ability usage for all players
  Object.values(game.playerStates).forEach((state) => {
    state.districtsPlayedThisTurn = 0
    state.hasUsedAbility = false
  })

  game.currentCharacterId++
  if (game.currentCharacterId > 8) {
    // Check for win condition at the end of the round
    const scores = Object.entries(game.playerStates).map(
      ([playerId, state]) => {
        // Base score is sum of district costs
        const costScore = state.city.reduce(
          (sum, district) => sum + district.cost,
          0
        )

        // Check for color bonus (3 points for having all types)
        const districtTypes = new Set(state.city.map((d) => d.type))
        const colorBonus = districtTypes.size === 5 ? 3 : 0 // 5 types: noble, religious, trade, military, unique

        // Check if this player has completed their city
        const isCompleted = state.city.length >= DISTRICTS_TO_WIN

        return {
          playerId,
          score: costScore + colorBonus,
          isCompleted,
          rawScore: costScore,
          hasColorBonus: colorBonus > 0,
        }
      }
    )

    // End game if any player has enough districts
    if (scores.some((p) => p.isCompleted)) {
      // Add completion bonus to the first player who completed their city
      // Only one player can get this bonus
      const firstCompleted = scores.find((p) => p.isCompleted)
      if (firstCompleted) {
        firstCompleted.score += 4 // Completion bonus
      }

      // Sort by total score (highest first)
      scores.sort((a, b) => b.score - a.score)

      // Convert to game over format
      const results: Record<PlayerId, number> = {}
      scores.forEach(({ playerId, score }) => {
        results[playerId] = score
      })

      Rune.gameOver({
        players: results,
      })
      return
    }

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

// Define Rune client type globally
declare global {
  const Rune: RuneClient<GameState, GameActions>
}

// Initialize game logic
Rune.initLogic({
  minPlayers: 2,
  maxPlayers: 4,
  setup: (allPlayerIds: PlayerId[]): GameState => {
    // Get available characters for this game
    const { availableCharacters, removedCharacter, unavailableCharacter } =
      getAvailableCharacters()

    // Shuffle the deck
    const shuffledDeck = shuffle([...DISTRICTS])

    // Deal 4 cards to each player
    const playerStates = Object.fromEntries(
      allPlayerIds.map((id) => {
        const hand = shuffledDeck.splice(0, 4)
        return [
          id,
          {
            coins: 2,
            hand,
            city: [],
            districtsPlayedThisTurn: 0,
            hasUsedAbility: false,
          },
        ]
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
      availableCharacters,
      removedCharacterId: removedCharacter.id,
      unavailableCharacterId: unavailableCharacter.id,
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

      // Check if character is in available list
      const character = game.availableCharacters.find(
        (c) => c.id === characterId
      )
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

      // Mark ability as used for targeting abilities only when target is selected
      if (payload !== null) {
        playerState.hasUsedAbility = true
      }

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
          // Mark passive abilities as used immediately
          playerState.hasUsedAbility = true
          break
        }

        case "Bishop": {
          const religiousDistrictCount = playerState.city.filter(
            (d) => d.type === "religious"
          ).length
          playerState.coins += religiousDistrictCount
          // Mark passive abilities as used immediately
          playerState.hasUsedAbility = true
          break
        }

        case "Merchant": {
          playerState.coins += 1
          const tradeDistrictCount = playerState.city.filter(
            (d) => d.type === "trade"
          ).length
          playerState.coins += tradeDistrictCount
          // Mark passive abilities as used immediately
          playerState.hasUsedAbility = true
          break
        }

        case "Architect": {
          const drawCount = Math.min(2, game.deck.length)
          const drawnCards = game.deck.splice(0, drawCount)
          playerState.hand.push(...drawnCards)
          // Mark passive abilities as used immediately
          playerState.hasUsedAbility = true
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
            // Only mark as used if not going into targeting mode
            if (militaryDistrictCount === 0) {
              playerState.hasUsedAbility = true
            }
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

      // Check for district playing limit based on character
      const maxDistricts = playerState.character?.name === "Architect" ? 3 : 1
      if (playerState.districtsPlayedThisTurn >= maxDistricts)
        throw Rune.invalidAction()

      playerState.coins -= district.cost
      playerState.city.push(district)
      playerState.hand = playerState.hand.filter((d) => d.id !== districtId)
      playerState.districtsPlayedThisTurn++

      // If the player has reached their district limit, start the auto-end timer
      if (playerState.districtsPlayedThisTurn >= maxDistricts) {
        game.lastTurnChange = Rune.gameTime()
      }
    },

    drawCards: (
      { cardIndex }: { cardIndex?: number },
      { game, playerId }
    ): void => {
      if (!isPlayerTurn(game, playerId)) throw Rune.invalidAction()

      const playerState = game.playerStates[playerId]

      // If cardIndex is undefined, we're starting the draw process
      if (cardIndex === undefined) {
        const drawCount = Math.min(2, game.deck.length)
        const drawnCards = game.deck.splice(0, drawCount)
        game.targetSelection = {
          type: "draw_cards",
          active: true,
          cards: drawnCards,
        }
      } else {
        // Player has chosen which card to keep
        if (
          !game.targetSelection?.cards ||
          game.targetSelection.type !== "draw_cards"
        ) {
          throw Rune.invalidAction()
        }

        const drawnCards = game.targetSelection.cards
        const keptCard = drawnCards[cardIndex]
        if (!keptCard) throw Rune.invalidAction()

        // Add the chosen card to player's hand
        playerState.hand.push(keptCard)

        // Put the other card at the bottom of the deck
        const otherCard = drawnCards[cardIndex === 0 ? 1 : 0]
        if (otherCard) {
          game.deck.push(otherCard)
        }

        // Clear the target selection
        game.targetSelection = undefined
      }
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

    // Auto-advance if current character is assassinated
    if (game.currentCharacterId === game.assassinatedCharacterId) {
      const timeSinceChange = Rune.gameTime() - (game.lastTurnChange || 0)
      if (timeSinceChange >= TURN_AUTO_ADVANCE_MS) {
        advanceToNextCharacter(game)
      }
      return
    }

    // Find current player if any
    const currentPlayer = Object.entries(game.playerStates).find(
      ([, state]) => state.character?.id === game.currentCharacterId
    )

    if (currentPlayer) {
      const [, playerState] = currentPlayer
      const maxDistricts = playerState.character?.name === "Architect" ? 3 : 1

      // Check if turn should auto-end (reached district limit AND used ability)
      const hasReachedDistrictLimit =
        playerState.districtsPlayedThisTurn >= maxDistricts

      if (hasReachedDistrictLimit && playerState.hasUsedAbility) {
        const timeSinceChange = Rune.gameTime() - (game.lastTurnChange || 0)
        if (timeSinceChange >= TURN_AUTO_ADVANCE_MS) {
          advanceToNextCharacter(game)
        }
      }
      return
    }

    // If no player has this character, auto-advance after delay
    const timeSinceChange = Rune.gameTime() - (game.lastTurnChange || 0)
    if (timeSinceChange >= TURN_AUTO_ADVANCE_MS) {
      advanceToNextCharacter(game)
    }
  },
})

// Helper functions
interface AvailableCharactersResult {
  availableCharacters: Character[]
  removedCharacter: Character
  unavailableCharacter: Character
}

function getAvailableCharacters(): AvailableCharactersResult {
  const allCharacters = [...CHARACTERS]

  // Remove a random character that isn't the King
  const availableForRemoval = allCharacters.filter((c) => c.id !== 4) // Don't remove King
  const removedIndex = Math.floor(Math.random() * availableForRemoval.length)
  const removedCharacter = availableForRemoval[removedIndex]
  const remainingCharacters = allCharacters.filter(
    (c) => c.id !== removedCharacter.id
  )

  // Mark another non-King character as unavailable
  const availableForUnavailable = remainingCharacters.filter((c) => c.id !== 4)
  const unavailableIndex = Math.floor(
    Math.random() * availableForUnavailable.length
  )
  const unavailableCharacter = availableForUnavailable[unavailableIndex]

  // Return the final 6 available characters
  const finalCharacters = remainingCharacters.filter(
    (c) => c.id !== unavailableCharacter.id
  )

  return {
    availableCharacters: finalCharacters,
    removedCharacter,
    unavailableCharacter,
  }
}
