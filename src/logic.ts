import type { PlayerId, RuneClient } from "rune-sdk"

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
  currentTurn: number
  crownHolder?: PlayerId
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

// District cards data
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

type GameActions = {
  takeCoins: () => void
  selectCharacter: (characterId: number) => void
  useCharacterAbility: (targetId?: string) => void
  playDistrict: (districtId: string) => void
  drawCards: (keep: number) => void
}

// Helper to shuffle an array
function shuffle<T>(array: T[]): T[] {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

declare global {
  const Rune: RuneClient<GameState, GameActions>
}

Rune.initLogic({
  minPlayers: 2,
  maxPlayers: 6,
  setup: (allPlayerIds) => {
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
      currentTurn: 0,
      crownHolder,
    }
  },
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
    useCharacterAbility: (_payload, { game, playerId }) => {
      const playerState = game.playerStates[playerId]
      if (!playerState?.character) {
        throw Rune.invalidAction()
      }

      switch (playerState.character.name) {
        case "Assassin": {
          // Will need UI to select a character to kill
          break
        }
        case "Thief": {
          // Will need UI to select a character to steal from
          break
        }
        case "Magician": {
          // Will need UI to select cards to exchange
          break
        }
        case "King": {
          // Transfer the crown to this player
          game.crownHolder = playerId

          // Give gold for noble districts
          const nobleDistrictCount = playerState.city.filter(
            (d) => d.type === "noble"
          ).length
          playerState.coins += nobleDistrictCount
          break
        }
        case "Bishop": {
          // Give gold for religious districts
          const religiousDistrictCount = playerState.city.filter(
            (d) => d.type === "religious"
          ).length
          playerState.coins += religiousDistrictCount
          break
        }
        case "Merchant": {
          // Give extra gold and gold for trade districts
          playerState.coins += 1 // Extra gold first
          const tradeDistrictCount = playerState.city.filter(
            (d) => d.type === "trade"
          ).length
          playerState.coins += tradeDistrictCount
          break
        }
        case "Architect": {
          // Draw 2 cards
          const drawCount = Math.min(2, game.deck.length)
          const drawnCards = game.deck.splice(0, drawCount)
          playerState.hand.push(...drawnCards)
          break
        }
        case "Warlord": {
          // Will need UI to select a district to destroy
          // Give gold for military districts first
          const militaryDistrictCount = playerState.city.filter(
            (d) => d.type === "military"
          ).length
          playerState.coins += militaryDistrictCount
          break
        }
      }
    },
    playDistrict: (districtId, { game, playerId }) => {
      const playerState = game.playerStates[playerId]
      const district = playerState.hand.find((d) => d.id === districtId)
      if (!district) {
        throw Rune.invalidAction()
      }

      // Pay the district cost
      if (playerState.coins < district.cost) {
        throw Rune.invalidAction()
      }
      playerState.coins -= district.cost

      // Add district to player's city
      playerState.city.push(district)

      // Remove district from player's hand
      playerState.hand = playerState.hand.filter((d) => d.id !== districtId)

      // TODO: Implement district effects
    },
    drawCards: (keep, { game, playerId }) => {
      const playerState = game.playerStates[playerId]
      const drawCount = Math.min(keep, game.deck.length)

      // Draw cards from the deck
      const drawnCards = game.deck.slice(0, drawCount)
      playerState.hand.push(...drawnCards)

      // Remove drawn cards from the deck
      game.deck = game.deck.slice(drawCount)

      // TODO: Implement decision UI for drawn cards
    },
  },
})
