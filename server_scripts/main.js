/**
 * @typedef {Object} ServerKathData
 * @property {Array<ArenaData>} arenas - The arenas in the server
 * @property {Array} teamDesignationBlocks - The teams in the server
 * @property {Array<KitData>} kits - The kits in the server
 * @property {Object.<string, PlayerKathData>} playerData - The player data in the server. Key is UUID
 */

/**
 * @typedef {Object} ArenaData
 * @property {string} name - The name of the arena
 * @property {?Object} corner1 - The first corner of the arena
 * @property {?Object} corner2 - The second corner of the arena
 * @property {Array<ArenaSpawnLocation>} spawns - The spawn points in the arena
 * @property {number} active - Whether the arena is active or not. 0 = inactive, >0 time it was activated
 * @property {Array<string>} players - The UUID of players active in the arena
 * @property {string} gamemode - The gamemode of the arena. Default: TDM
 * @property {Array<HostageTeam>} teams - The teams that are held by the Arena.
 */

/**
 * @typedef {Object} HostageTeam
 * @property {string} team - The name of the team
 * @property {string} givenMinecraftName - The name of the team in Minecraft
 */

/**
 * @typedef {Object} ArenaSpawnLocation
 * @property {number} x - The x coordinate of the spawn
 * @property {number} y - The y coordinate of the spawn
 * @property {number} z - The z coordinate of the spawn
 * @property {number} original_block - The block that was originally there
 */


/**
 * @typedef {Object} PlayerKathData
 * @property {string} name - The name of the player
 * @property {string|null} kit - Name of the kit the player has selected 
 * @property {string|null} team - Name of the team the player is in
 * @property {string|null} arena - Name of the arena the player is in
 * @property {number} kills - Number of kills the player has
 * @property {number} currentKills - Number of kills the player has in the currently participating arena
 * @property {number} killStreak - Player's kill streak
 * @property {number} deaths - Number of deaths the player has
 * @property {number} deathStreak - Player's death streak
 * @property {number} currentDeaths - Number of deaths the player has in the currently participating arena
 * @property {number} points - Number of points the player has
 * @property {number} singleWins = Number of single wins the player has when they were alone in a team
 * @property {number} teamWins = Number of team wins the player has when they were in a team
 * @property {number} lastSelectedSlot - The last slot the player selected
 * @property {number} arenaParticipation - The number of times the player has participated in an arena
 */

// Quick func to print to console/server
function print(text){
    Utils.server.tell(text)
    console.log(text)
}

/**
 * Helper function to convert a name to UUID
 * @param {string} name 
 * @returns 
 */
function playerNameToUUID(name){
    let psData = getPSData();
    if(!psData) return null;
    for(const uuid in psData.playerData){
        if(psData.playerData[uuid].name.toLowerCase() == name.toLowerCase()){
            return uuid;
        }
    }

    let server = Utils.getServer();
    if(!server) return null;
    let player = server.getPlayer(name);
    if(player){
        return player.getStringUuid();
    }

    return null;
}

/**
 * Gets the persistent data of the server
 * @returns {ServerKathData}
 */
function getPSData(){
    let server = Utils.getServer();
    if(!server) return;
    let data = server.persistentData.get("kath");
    if(!data) data = {}
    if(!data.arenas) data.arenas = [];
    if(!data.teamDesignationBlocks) data.teamDesignationBlocks = [];
    if(!data.kits) data.kits = [];
    if(!data.playerData) data.playerData = {};

    server.persistentData.put("kath", data);
    return data;
}

// An event to run when the server is first loaded.
ServerEvents.loaded((event)=>{
    let server = event.server;
    server.runCommandSilent("team add Spawn");
    server.runCommandSilent("team modify Spawn color white");
    server.runCommandSilent("team modify Spawn friendlyFire false");
    server.runCommandSilent("team join Spawn @a");
    getPSData();
})

/**
 * Gets player data
 * @param {string} player - Player name
 * @returns {null|PlayerKathData}
 */
function getPlayerData(player){
    let psData = getPSData();
    if(!psData) return null;
    let uuid = playerNameToUUID(player);
    if(!uuid) return null;;

    /**
     * @type {PlayerKathData}
     */
    let data = psData.playerData[uuid];
    if(!data){
        if(!data){
            data = {};
        }
    }
    if(!data.name){
        data.name = player;
    }
    if(!data.kills) data.kills = 0;
    if(!data.currentKills) data.currentKills = 0;
    if(!data.killStreak) data.killStreak = 0;
    if(!data.deaths) data.deaths = 0;
    if(!data.currentDeaths) data.currentDeaths = 0;
    if(!data.deathStreak) data.deathStreak = 0;
    if(!data.points) data.points = 0;

    if(!data.arenaParticipation) data.arenaParticipation = 0;

    if(!data.singleWins) data.singleWins = 0;
    if(!data.teamWins) data.teamWins = 0;

    if(typeof data.lastSelectedSlot == "undefined") data.lastSelectedSlot = 0;
    return data;
}

/**
 * Saves player data
 * @param {Internal.ServerPlayer} player 
 * @param {PlayerKathData} data 
 */
function savePlayerData(player, data){
    let server = Utils.getServer();
    if(server){
        let serverData = getPSData();
        if(!serverData) return;
        serverData.playerData[player.uuid] = data;
        server.persistentData.put("kath", serverData);
    }
    player.persistentData.put("kath", data);
}

/**
 * Gets the data of an arena
 * @param {string} arenaName 
 * @returns {ArenaData|undefined}
 */
function getArenaData(arenaName){
    let psData = getPSData();
    if(!psData) return undefined;
    let arena = psData.arenas.find(a => a.name.toLowerCase() == arenaName.toLowerCase());
    if(!arena){
        return undefined;
    }

    if(!arena.name) arena.name = arenaName;
    if(!arena.spawns) arena.spawns = [];
    if(!arena.players) arena.players = [];
    if(!arena.active) arena.active = 0;
    if(!arena.gamemode) arena.gamemode = "tdm";
    if(!arena.teams) arena.teams = [];

    return arena;
}

/**
 * Overwrites the arena data
 * @param {ArenaData} data 
 */
function saveArenaData(data){
    let server = Utils.getServer();
    if(!server) return;
    try{
        let serverData = getPSData();
        if(!serverData) return;
        let index = serverData.arenas.findIndex(a => a.name == data.name);
        if(index == -1){
            serverData.arenas.push(data);
        }else{
            serverData.arenas[index] = data;
        }
    
        server.persistentData.put("kath", serverData);
    }catch(e){
        print(e)
    }
}

/**
 * Saves the persistent server data
 * @param {ServerKathData} data 
 * @returns 
 */
function savePSData(data){
    let server = Utils.getServer();
    if(!server) return;
    server.persistentData.put("kath", data);
}

/**
 * Helper functiont o build buttons in chat
 * @param {string} text 
 * @param {*} color Decimal color code
 * @param {string} command Minecraft command
 */
function chatButton(text, command, color){
    if(!color){
        color = "green"
    }
    return JSON.stringify({
        text: `[${text}]`,
        color: color,
        bold: true,
        clickEvent: {
            action: "run_command",
            value: command
        }
    })
}