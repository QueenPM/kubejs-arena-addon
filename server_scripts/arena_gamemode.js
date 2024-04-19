/**
 * @typedef {Object} ArenaGamemodeData
 * @property {string} name - The name of the gamemode
 * @property {string} displayName - The display name of the gamemode
 * @property {string} description - The description of the gamemode
 * @property {Array<ArenaGamemodeTeamRules>} teams - The number of players per team
 * @property {number} timeLimit - The time limit of the gamemode
 */

/**
 * @typedef {Object} ArenaGamemodeTeamRules
 * @property {string} team - The name of the team
 * @property {number} maxPlayers - The maximum number of players that can play the gamemode. 0 for off
 * @property {number} minPlayers - The minimum number of players needed to start the gamemode
 * @property {string} [identity] - The mob identity of the team, can be null or undefined
 */


/**
 * @type {Array<ArenaGamemodeData>}
 */
const GAMEMODES = [
    {
        name: "tdm",
        displayName: "Team Deathmatch",
        description: "Kill the other team to win",
        timeLimit: 1000 * 60 * 5,
        teams: [
            {
                team: "Blue",
                maxPlayers: 0,
                minPlayers: 1
            },
            {
                team: "Red",
                maxPlayers: 0,
                minPlayers: 1
            }
        ]
    },
    {
        name: "ffa",
        displayName: "Free For All",
        description: "Kill everyone to win",
        timeLimit: 1000 * 60 * 5,
        teams: [
            {
                team: "Gray",
                maxPlayers: 0,
                minPlayers: 2
            }
        ]
    }
]

/**
 * Gets the Arena Gamemode Data
 * @param {ArenaData} arena 
 */
function getArenaGamemode(arena){
    return GAMEMODES.find(g => g.name == arena.gamemode);
}