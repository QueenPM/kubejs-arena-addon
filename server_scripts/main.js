/**
 * @typedef {Object} ServerKathData
 * @property {Array<ArenaData>} arenas - The arenas in the server
 * @property {Array} teamDesignationBlocks - The teams in the server
 */

/**
 * @typedef {Object} ArenaData
 * @property {string} name - The name of the arena
 * @property {?Object} corner1 - The first corner of the arena
 * @property {?Object} corner2 - The second corner of the arena
 * @property {Array} spawns - The spawn points in the arena
 * @property {number} active - Whether the arena is active or not. 0 = inactive, >0 time it was activated
 */


/**
 * @typedef {Object} PlayerKathData
 * @property {string|null} kit - Name of the kit the player has selected 
 * @property {string|null} team - Name of the team the player is in
 * @property {boolean} teamCommandAssigned
 * @property {number} kills - Number of kills the player has
 * @property {number} deaths - Number of deaths the player has
 */

// Quick func to print to console/server
function print(text){
    Utils.server.tell(text)
}

/**
 * Gets the persistent data of the server
 * @returns {ServerKathData}
 */
function getPSData(){
    let server = Utils.getServer();
    if(!server) return;
    let data = server.persistentData.get("kath");
    if(!data){
        data = {}
    }

    if(!data.arenas){
        data.arenas = [];
    }

    if(!data.teamDesignationBlocks){
        data.teamDesignationBlocks = [];
    }


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

// When a player spawns in, always assign the "Spawn" team to them and put them back into spawn
PlayerEvents.loggedIn((event) => {
    // Give them the "Spawn" team
    event.server.runCommandSilent(`team join Spawn ${event.player.username}`);
    // Put them back in spawn
    event.server.runCommandSilent(`kill ${event.player.username}`);
})

/**
 * Gets player data
 * @param {Internal.ServerPlayer} player 
 * @returns {null|PlayerKathData}
 */
function getPlayerData(player){
    let data = player.persistentData.get("kath");
    if(!data){
        data = {}
    }
    if(!data.kit) data.kit = null;
    if(!data.team) data.team = null;
    if(!data.teamCommandAssigned) data.teamCommandAssigned = false;
    if(!data.kills) data.kills = 0;
    if(!data.deaths) data.deaths = 0;

    if(data != player.persistentData.get("kath")){
        player.persistentData.put("kath", data);
    }
    return data;
}

/**
 * Saves player data
 * @param {Internal.ServerPlayer} player 
 * @param {PlayerKathData} data 
 */
function savePlayerData(player, data){
    player.persistentData.put("kath", data);
}

/**
 * Gets the data of an arena
 * @param {string} arenaName 
 * @returns {ArenaData|undefined}
 */
function getArenaData(arenaName){
    let data = getPSData();
    if(!data) return undefined;
    if(data.arenas){
        return data.arenas.find(a => a.name == arenaName);
    }else{
        return undefined;
    }
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