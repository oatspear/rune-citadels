import { useState } from "react"
import { DISTRICTS_TO_WIN } from "../logic"

interface HelpOverlayProps {
  phase: "CHARACTER_SELECTION" | "PLAY_TURNS"
  characterId?: number
  // Optional characterId for specific help related to a character
  // If characterId is provided, the help text can include character-specific instructions
  // If characterId is not provided, the help text is general
  closeHelp?: () => void
}

export function HelpOverlay({
  phase,
  characterId,
  closeHelp,
}: HelpOverlayProps) {
  const [language, setLanguage] = useState("en")
  const handleLanguageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLanguage(event.target.value) // Update the language state
  }

  const getObjectiveText = () => {
    if (phase === "CHARACTER_SELECTION") {
      switch (language) {
        case "es":
          return "Selecciona un personaje para comenzar la ronda. Cada personaje tiene habilidades únicas."
        case "fr":
          return "Sélectionnez un personnage pour commencer le tour. Chaque personnage a des capacités uniques."
        case "de":
          return "Wählen Sie einen Charakter, um die Runde zu beginnen. Jeder Charakter hat einzigartige Fähigkeiten."
        case "ru":
          return "Выберите персонажа, чтобы начать раунд. У каждого персонажа есть уникальные способности."
        case "pt":
          return "Selecione uma personagem para iniciar a rodada. Cada personagem tem habilidades únicas."
        case "it":
          return "Seleziona un personaggio per iniziare il turno. Ogni personaggio ha abilità uniche."
        default:
          return "Select a character to start the round. Each character has unique abilities."
      }
    }
    switch (language) {
      case "es":
        return `Construye ${DISTRICTS_TO_WIN} distritos. Los distritos más caros dan más puntos.`
      case "fr":
        return `Construisez ${DISTRICTS_TO_WIN} districts. Les districts plus chers rapportent plus de points.`
      case "de":
        return `Bauen Sie ${DISTRICTS_TO_WIN} Bezirke. Teurere Bezirke bringen mehr Punkte.`
      case "ru":
        return `Постройте ${DISTRICTS_TO_WIN} района. Более дорогие районы приносят больше очков.`
      case "pt":
        return `Construa ${DISTRICTS_TO_WIN} distritos. Distritos mais caros dão mais pontos.`
      case "it":
        return `Costruisci ${DISTRICTS_TO_WIN} distretti. I distretti più costosi danno più punti.`
      default:
        return `Build ${DISTRICTS_TO_WIN} Districts. More expensive Districts give more points.`
    }
  }

  const getPhaseTitle = () => {
    switch (phase) {
      case "CHARACTER_SELECTION":
        switch (language) {
          case "es":
            return "Selección de Personajes"
          case "fr":
            return "Sélection des Personnages"
          case "de":
            return "Charakterauswahl"
          case "ru":
            return "Выбор Персонажей"
          case "pt":
            return "Seleção de Personagens"
          case "it":
            return "Selezione dei Personaggi"
        }
        return "Character Selection"
      case "PLAY_TURNS":
        switch (language) {
          case "es":
            return "Juego"
          case "fr":
            return "Jeu"
          case "de":
            return "Spiel"
          case "ru":
            return "Игровой процесс"
          case "pt":
            return "Jogo"
          case "it":
            return "Gioco"
        }
        return "Gameplay"
      default:
        switch (language) {
          case "es":
            return "Ayuda del Juego"
          case "fr":
            return "Aide du Jeu"
          case "de":
            return "Spielhilfe"
          case "ru":
            return "Помощь по Игре"
          case "pt":
            return "Ajuda do Jogo"
          case "it":
            return "Aiuto del Gioco"
        }
        return "Game Help"
    }
  }

  const getHelpText = () => {
    switch (phase) {
      case "CHARACTER_SELECTION":
        switch (language) {
          case "es":
            return "Los personajes se juegan en orden: Asesino, Ladrón, Mago, Rey, Obispo, Mercader, Arquitecto, Señor de la Guerra."
          case "fr":
            return "Les personnages jouent dans l'ordre : Assassin, Voleur, Magicien, Roi, Evêque, Marchand, Architecte, Seigneur de Guerre."
          case "de":
            return "Charaktere spielen in folgender Reihenfolge: Assassine, Dieb, Magier, König, Bischof, Händler, Architekt, Kriegsherr."
          case "ru":
            return "Персонажи играют в следующем порядке: Ассасин, Вор, Маг, Король, Епископ, Купец, Архитектор, Военачальник."
          case "pt":
            return "As personagens jogam na seguinte ordem: Assassino, Ladrão, Mago, Rei, Bispo, Mercador, Arquiteto, Guerreiro."
          case "it":
            return "I personaggi giocano in ordine: Assassino, Ladro, Mago, Re, Vescovo, Mercante, Architetto, Signore della Guerra."
        }
        return "Characters play in order: Assassin, Thief, Magician, King, Bishop, Merchant, Architect, Warlord."
      case "PLAY_TURNS":
        switch (language) {
          case "es":
            return "Toma 2 de Oro o 1 carta de Distrito del mazo. Puedes construir un distrito o usar la habilidad de tu personaje."
          case "fr":
            return "Prenez 2 Or ou 1 carte District du deck. Vous pouvez construire un district ou utiliser la capacité de votre personnage."
          case "de":
            return "Nehmen Sie 2 Gold oder 1 Distriktkarte vom Deck. Sie können einen Distrikt bauen oder die Fähigkeit Ihres Charakters nutzen."
          case "ru":
            return "Возьмите 2 золота или 1 карту района из колоды. Вы можете построить район или использовать способность вашего персонажа."
          case "pt":
            return "Pegue 2 Ouro ou 1 carta de Distrito do baralho. Pode construir um distrito ou usar a habilidade da sua personagem."
          case "it":
            return "Prendi 2 Oro o 1 carta Distretto dal mazzo. Puoi costruire un distretto o usare l'abilità del tuo personaggio."
        }
        return "Take 2 Gold or 1 District card from the deck. You can build a district or use your character's ability."
      default:
        switch (language) {
          case "es":
            return "Bienvenido al juego! Sigue las instrucciones para jugar."
          case "fr":
            return "Bienvenue dans le jeu! Suivez les instructions pour jouer."
          case "de":
            return "Willkommen im Spiel! Befolgen Sie die Anweisungen, um zu spielen."
          case "ru":
            return "Добро пожаловать в игру! Следуйте инструкциям, чтобы играть."
          case "pt":
            return "Bem-vindo ao jogo! Siga as instruções para jogar."
          case "it":
            return "Benvenuto nel gioco! Segui le istruzioni per giocare."
        }
        return "Welcome to the game! Follow the instructions to play."
    }
  }

  const getCharacterName = (characterId: number) => {
    switch (characterId) {
      case 1: // Assassin
        switch (language) {
          case "es":
            return "Asesino"
          case "fr":
            return "Assassin"
          case "de":
            return "Assassine"
          case "ru":
            return "Ассасин"
          case "pt":
            return "Assassino"
          case "it":
            return "Assassino"
          default:
            return "Assassin"
        }
      case 2: // Thief
        switch (language) {
          case "es":
            return "Ladrón"
          case "fr":
            return "Voleur"
          case "de":
            return "Dieb"
          case "ru":
            return "Вор"
          case "pt":
            return "Ladrão"
          case "it":
            return "Ladro"
          default:
            return "Thief"
        }
      case 3: // Magician
        switch (language) {
          case "es":
            return "Mago"
          case "fr":
            return "Magicien"
          case "de":
            return "Magier"
          case "ru":
            return "Маг"
          case "pt":
            return "Mago"
          case "it":
            return "Mago"
          default:
            return "Magician"
        }
      case 4: // King
        switch (language) {
          case "es":
            return "Rey"
          case "fr":
            return "Roi"
          case "de":
            return "König"
          case "ru":
            return "Король"
          case "pt":
            return "Rei"
          case "it":
            return "Re"
          default:
            return "King"
        }
      case 5: // Bishop
        switch (language) {
          case "es":
            return "Obispo"
          case "fr":
            return "Évêque"
          case "de":
            return "Bischof"
          case "ru":
            return "Епископ"
          case "pt":
            return "Bispo"
          case "it":
            return "Vescovo"
          default:
            return "Bishop"
        }
      case 6: // Merchant
        switch (language) {
          case "es":
            return "Mercader"
          case "fr":
            return "Marchand"
          case "de":
            return "Händler"
          case "ru":
            return "Купец"
          case "pt":
            return "Mercador"
          case "it":
            return "Mercante"
          default:
            return "Merchant"
        }
      case 7: // Architect
        switch (language) {
          case "es":
            return "Arquitecto"
          case "fr":
            return "Architecte"
          case "de":
            return "Architekt"
          case "ru":
            return "Архитектор"
          case "pt":
            return "Arquiteto"
          case "it":
            return "Architetto"
          default:
            return "Architect"
        }
      case 8: // Warlord
        switch (language) {
          case "es":
            return "Señor de la Guerra"
          case "fr":
            return "Seigneur de Guerre"
          case "de":
            return "Kriegsherr"
          case "ru":
            return "Военачальник"
          case "pt":
            return "Guerreiro"
          case "it":
            return "Signore della Guerra"
        }
        return "Warlord"
      default:
        switch (language) {
          case "es":
            return "Desconocido"
          case "fr":
            return "Inconnu"
          case "de":
            return "Unbekannt"
          case "ru":
            return "Неизвестный"
          case "pt":
            return "Desconhecido"
          case "it":
            return "Sconosciuto"
        }
        return "Unknown"
    }
  }

  const getCharacterAbilityDescription = (characterId: number) => {
    // get ability descriptions in all languages
    switch (characterId) {
      case 1: // Assassin
        switch (language) {
          case "es":
            return "Elige un personaje para asesinar. No podrá jugar esta ronda."
          case "fr":
            return "Choisissez un personnage à assassiner. Il ne pourra pas jouer ce tour."
          case "de":
            return "Wählen Sie einen Charakter zum Assassieren. Er kann diese Runde nicht spielen."
          case "ru":
            return "Выберите персонажа для убийства. Он не сможет играть в этом раунде."
          case "pt":
            return "Escolha um personagem para assassinar. Ele não poderá jogar nesta rodada."
          case "it":
            return "Scegli un personaggio da assassinare. Non potrà giocare questo turno."
        }
        return "Choose a character to assassinate. They cannot play this round."
      case 2: // Thief
        switch (language) {
          case "es":
            return "Elige un personaje y roba todo su oro."
          case "fr":
            return "Choisissez un personnage et volez tout son or."
          case "de":
            return "Wählen Sie einen Charakter und stehlen Sie sein gesamtes Gold."
          case "ru":
            return "Выберите персонажа и украдите все его золото."
          case "pt":
            return "Escolha uma personagem e roube todo o ouro dela."
          case "it":
            return "Scegli un personaggio e ruba tutto il suo oro."
        }
        return "Choose a character and steal all their gold."
      case 3: // Magician
        switch (language) {
          case "es":
            return "Intercambia tu mano con otro jugador o el mazo."
          case "fr":
            return "Échangez votre main avec un autre joueur ou le deck."
          case "de":
            return "Tauschen Sie Ihre Hand mit einem anderen Spieler oder dem Deck aus."
          case "ru":
            return "Обменяйте свою руку с другим игроком или колодой."
          case "pt":
            return "Troque a sua mão com outro jogador ou com o baralho."
          case "it":
            return "Scambia la tua mano con un altro giocatore o il mazzo."
        }
        return "Exchange your hand with another player or the deck."
      case 4: // King
        switch (language) {
          case "es":
            return "Toma la corona. Obtén +1 Oro por cada Distrito Noble."
          case "fr":
            return "Prenez la couronne. Gagnez +1 Or par District Noble."
          case "de":
            return "Nehmen Sie die Krone. Erhalten Sie +1 Gold pro Adelsdistrikt."
          case "ru":
            return "Возьмите корону. Получите +1 золота за каждый благородный район."
          case "pt":
            return "Fique com a coroa. Ganhe +1 Ouro por cada Distrito Nobre."
          case "it":
            return "Prendi la corona. Ottieni +1 Oro per ogni Distretto Nobile."
        }
        return "Take the crown. Gain +1 Gold per Noble District."
      case 5: // Bishop
        switch (language) {
          case "es":
            return "Tus Distritos no pueden ser destruidos. Obtén +1 Oro por cada Distrito Religioso."
          case "fr":
            return "Vos Districts ne peuvent pas être détruits. Gagnez +1 Or par District Religieux."
          case "de":
            return "Ihre Bezirke können nicht zerstört werden. Erhalten Sie +1 Gold pro Religiösem Bezirk."
          case "ru":
            return "Ваши районы не могут быть уничтожены. Получите +1 золота за каждый религиозный район."
          case "pt":
            return "Os seus Distritos não podem ser destruídos. Ganhe +1 Ouro por cada Distrito Religioso."
          case "it":
            return "I tuoi Distretti non possono essere distrutti. Ottieni +1 Oro per ogni Distretto Religioso."
        }
        return "Your Districts cannot be destroyed. Gain +1 Gold per Religious District."
      case 6: // Merchant
        switch (language) {
          case "es":
            return "Obtén +1 Oro. Obtén +1 Oro adicional por cada Distrito Comercial."
          case "fr":
            return "Gagnez +1 Or. Gagnez +1 Or supplémentaire par District Commercial."
          case "de":
            return "Erhalten Sie +1 Gold. Erhalten Sie +1 zusätzliches Gold pro Handelsdistrikt."
          case "ru":
            return "Получите +1 золота. Получите +1 дополнительное золото за каждый торговый район."
          case "pt":
            return "Ganhe +1 Ouro. Ganhe +1 Ouro adicional por cada Distrito Comercial."
          case "it":
            return "Ottieni +1 Oro. Ottieni +1 Oro aggiuntivo per ogni Distretto Commerciale."
        }
        return "Gain +1 Gold. Gain +1 additional Gold per Trade District."
      case 7: // Architect
        switch (language) {
          case "es":
            return "Robas 2 cartas de Distrito. Puedes construir 3 Distritos este turno."
          case "fr":
            return "Piochez 2 cartes District. Vous pouvez construire 3 Districts ce tour."
          case "de":
            return "Ziehen Sie 2 Distriktkarten. Sie können in dieser Runde 3 Bezirke bauen."
          case "ru":
            return "Возьмите 2 карты района. Вы можете построить 3 района в этом раунде."
          case "pt":
            return "Ganhe 2 cartas de Distrito. Pode construir 3 Distritos nesta ronda."
          case "it":
            return "Pesca 2 carte Distretto. Puoi costruire 3 Distretti in questo turno."
        }
        return "Draw 2 District cards. You can build 3 Districts this turn."
      case 8: // Warlord
        switch (language) {
          case "es":
            return "Destruye un Distrito de tu elección por (Coste -1) Oro. Obtén +1 Oro por cada Distrito Militar."
          case "fr":
            return "Détruisez un District de votre choix pour (Coût -1) Or. Gagnez +1 Or par District Militaire."
          case "de":
            return "Zerstören Sie einen Bezirk Ihrer Wahl für (Kosten -1) Gold. Erhalten Sie +1 Gold pro Militärbezirk."
          case "ru":
            return "Уничтожьте район по вашему выбору за (стоимость -1) золота. Получите +1 золота за каждый военный район."
          case "pt":
            return "Destrua um Distrito à sua escolha por (Custo -1) Ouro. Ganhe +1 Ouro por cada Distrito Militar."
          case "it":
            return "Distruggi un Distretto a tua scelta per (Costo -1) Oro. Ottieni +1 Oro per ogni Distretto Militare."
        }
        return "Destroy a District of your choice for (Cost -1) Gold. Gain +1 Gold per Military District."
      default:
        switch (language) {
          case "es":
            return "Habilidad de personaje desconocida."
          case "fr":
            return "Capacité de personnage inconnue."
          case "de":
            return "Unbekannte Charakterfähigkeit."
          case "ru":
            return "Неизвестная способность персонажа."
          case "pt":
            return "Habilidade de personagem desconhecida."
          case "it":
            return "Abilità del personaggio sconosciuta."
        }
        return "Unknown character ability."
    }
  }

  return (
    <div className="help-overlay">
      {
        // a row of language buttons to translate the help text
        // the labels should display the country flag emoji for each language
        <div className="language-buttons">
          <label className={language === "en" ? "active" : ""}>
            <input
              type="radio"
              name="language"
              value="en"
              defaultChecked
              onChange={handleLanguageChange}
            />
            🇬🇧
          </label>
          <label className={language === "es" ? "active" : ""}>
            <input
              type="radio"
              name="language"
              value="es"
              onChange={handleLanguageChange}
            />
            🇪🇸
          </label>
          <label className={language === "fr" ? "active" : ""}>
            <input
              type="radio"
              name="language"
              value="fr"
              onChange={handleLanguageChange}
            />
            🇫🇷
          </label>
          <label className={language === "de" ? "active" : ""}>
            <input
              type="radio"
              name="language"
              value="de"
              onChange={handleLanguageChange}
            />
            🇩🇪
          </label>
          <label className={language === "ru" ? "active" : ""}>
            <input
              type="radio"
              name="language"
              value="ru"
              onChange={handleLanguageChange}
            />
            🇷🇺
          </label>
          <label className={language === "pt" ? "active" : ""}>
            <input
              type="radio"
              name="language"
              value="pt"
              onChange={handleLanguageChange}
            />
            🇵🇹
          </label>
          <label className={language === "it" ? "active" : ""}>
            <input
              type="radio"
              name="language"
              value="it"
              onChange={handleLanguageChange}
            />
            🇮🇹
          </label>
        </div>
      }
      <div className="help-content">
        <div>
          <h3>{getPhaseTitle()}</h3>
          <ul>
            <li>{getObjectiveText()}</li>
            <li>{getHelpText()}</li>
          </ul>
          {characterId && <h3>{getCharacterName(characterId)}</h3>}
          {characterId && <p>{getCharacterAbilityDescription(characterId)}</p>}
        </div>
      </div>
      {closeHelp && (
        <button className="close-help-button" onClick={closeHelp}>
          Close
        </button>
      )}
    </div>
  )
}
