
/**
 * Randomizes a spawnpoint for a player based on the arena
 * @param {Internal.ServerPlayer} player 
 * @param {ArenaData} arena 
 * @returns 
 */
function randomizeSpawn(player, arena){
    let server = Utils.getServer();
    if(!server) return;
    let playerData = getPlayerData(player.username);
    if(!playerData || !playerData.team) return;
    let availableSpawns = arena.spawns.filter(s => s.team == playerData.team);
    if(availableSpawns.length == 0) return;
    let spawn = availableSpawns[Math.floor(Math.random() * availableSpawns.length)];
    server.runCommand(`spawnpoint ${player.username} ${spawn.x + 0.5} ${spawn.y + 2} ${spawn.z + 0.5}`);
}

PlayerEvents.loggedIn((e)=>{
    // When a player logs in. Remove their Arena data
    let data = getPlayerData(e.player.username);
    if(!data) return;

    delete data.arena
    data.points = 0;
    data.currentDeaths = 0;
    data.currentKills = 0;
    data.deathStreak = 0;
    data.killStreak = 0;

    leaveTeam(e.player);
    e.server.runCommandSilent(`attribute ${e.player.username} minecraft:generic.knockback_resistance base set 10`)
})


PlayerEvents.respawned((e)=>{
    e.server.runCommandSilent(`attribute ${e.player.username} minecraft:generic.knockback_resistance base set 10`)
})

let invulnerablePlayers = [];

/**
 * Give a player Invulnerability & special effects
 * @param {Internal.ServerPlayer} player 
 */
function giveInvulnerability(player, lengthInSeconds){
    player.displayClientMessage('You are invulnerable for 5 seconds');
    player.server.runCommandSilent(`effect give ${player.username} minecraft:resistance ${lengthInSeconds} 5 true`);
    invulnerablePlayers.push(player.username);

    let inventory = player.inventory.getAllItems();
    player.inventory.clear();

    player.server.schedule(lengthInSeconds * 100, ()=>{
        invulnerablePlayers = invulnerablePlayers.filter(p => p != player.username);
        player.displayClientMessage('You are no longer invulnerable');

        for(const item of inventory){
            player.inventory.addItem(item.id, item.count);
        }
    })
}


PlayerEvents.tick(e=>{
    for(const player of invulnerablePlayers){
        if(player == e.player.username){
            e.server.runCommandSilent(`execute as ${player} run particle alexsmobs:worm_portal ${e.player.x} ${e.player.y+1} ${e.player.z} 0.2 0.5 0.2 0 2 normal`);
        }
    }
})

function playerFinishArena(){

}

// Player leave cleanup event
PlayerEvents.loggedOut(e=>{
    let data = getPlayerData(e.player.username);
    if(!data) return;

    let arena = data.arena;
    if(arena){
        let arenaData = getArenaData(data.arena);
        if(!arenaData) return;
        let players = arenaData.players;
        let gamemodeData = getArenaGamemode(arenaData);
        if(gamemodeData){
            let teams = gamemodeData.teams;
            for(const team of teams){
                if(team.team != data.team) continue;
                let teamPlayers = players.filter(p => p.team == team.name);
                if(teamPlayers - 1 < team.minPlayers){
                    stopActiveArena();
                    return;
                }
            }
        }
        
        delete data.arena;
        data.currentDeaths = 0;
        data.currentKills = 0;
        data.deathStreak = 0;
        data.killStreak = 0;
        data.points = 0;
        savePlayerData(e.player, data);
    }

    leaveTeam(e.player);
})