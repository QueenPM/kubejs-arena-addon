
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