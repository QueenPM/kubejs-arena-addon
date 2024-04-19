
// global var for the bossbar color. Used as a control to not spam the bossbar color change. Probably a better way to do this
let currentColor = "§a";

/**
 * Gets all points of all players in a specific arena
 * @returns 
 */
function getAllPlayerPoints(){
    let server = Utils.getServer();
    let players = server.getPlayers();
    let points = [];
    for(const player of players){
        let pData = getPlayerData(player.username);
        if(!pData) continue;
        if(!pData.team) continue;

        points.push({
            name: player.username,
            player: player,
            points: pData.points
        })
    }

    points.sort((a,b) => b.points - a.points);

    return points;
}

/**
 * Gets and returns all active players currently participating in a specific Arena
 * @param {string} arenaName
 * @returns {Array<Internal.ServerPlayer>}
 */
function getPlayersInArena(arenaName){
    let arena = getArenaData(arenaName);
    if(!arena) return [];
    let server = Utils.getServer();
    if(!server) return [];
    let players = server.getPlayers();
    let arenaPlayers = [];
    for(const player of players){
        let pData = getPlayerData(player.username);
        if(!pData) continue;
        if(pData.arena == arenaName){
            arenaPlayers.push(player);
        }
    }
    return arenaPlayers;
}

/**
 * Gets all available players who are part of a team and not currently participating in an arena
 * @returns {Array<Internal.ServerPlayer>}
 */
function getAvailablePlayers(){
    let server = Utils.getServer();
    let players = server.getPlayers();
    let availablePlayers = [];
    for(const player of players){
        let pData = getPlayerData(player.username);
        if(!pData) continue;
        if(pData.team && !pData.arena){
            availablePlayers.push(player);
        }
    }
    return availablePlayers;
}

/**
 * Stops the currently active arena
 * @returns 
 */
function stopActiveArena(){
    let activeArena = getActiveArenas()[0];
    let server = Utils.getServer();
    if(activeArena && server){
        let gamemode = getArenaGamemode(activeArena);
        if(!gamemode) return;

        server.runCommandSilent(`title @a title "§aEvent has concluded!"`);
        server.runCommandSilent(`title @a subtitle "Goodjob everyone!"`);

        // Hide the bossbar
        server.runCommandSilent(`bossbar set minecraft:0 visible false`);

        let points = getAllPlayerPoints();
        let players = getPlayersInArena(activeArena.name);
        server.tell(`§2Arena §5${activeArena.name} §2has concluded!`);

        if(players.length > 0){
            server.tell(`§bHere are the results:`);
            let winningTeam = null;
            let winningPlayer = null;
            if(gamemode.teams > 1){
                // It was Team Based
                let teamPoints = {};
                for(const point of points){
                    server.tell(`§c* ${point.name} achieved §6${point.points} §cpoints!`);
                    let team = getPlayerData(point.player.username).team;
                    if(!team) continue;
                    if(!teamPoints[team]) teamPoints[team] = 0;
                    teamPoints[team] += point.points;
                }
        
                winningTeam = teamPoints ? Object.keys(teamPoints).reduce((a, b) => teamPoints[a] > teamPoints[b] ? a : b) : null;
            }else{
                // It was Solo
                winningPlayer = points[0];
            }
    
            for(const participatingPlayer of players){
                let theirPoint = points.find(p => p.player.username == participatingPlayer.username);
                if(!theirPoint) continue;
                participatingPlayer.tell(`§a---------------------------------------`);
                participatingPlayer.tell(`§aYou achieved §6${theirPoint.points} §apoints!`);
    
                let data = getPlayerData(participatingPlayer.username);
                if(data){
                    data.points = 0;
                    data.currentDeaths = 0;
                    data.currentKills = 0;
                    data.deathStreak = 0;
                    data.killStreak = 0;
                    data.arenaParticipation++;
                    
                    if(winningTeam){
                        let team = participatingPlayer.team;
                        if(team == winningTeam){
                            let teamSize = players.filter(p => p.team == team).length;
                            if(teamSize == 1){
                                data.singleWins++;
                            }else if(teamSize > 1){
                                data.teamWins++;
                            }
                        }
                    }

                    if(winningPlayer){
                        if(winningPlayer.name.toLowerCase() == participatingPlayer.username.toLowerCase()){
                            data.singleWins++;
                        }
                    }
                    savePlayerData(participatingPlayer, data);
                }
                
                leaveTeam(participatingPlayer);
                server.schedule(50, ()=>{
                    server.runCommandSilent(`execute as ${participatingPlayer.username} run summon firework_rocket ~ ~ ~ {LifeTime:0,FireworksItem:{id:firework_rocket,Count:1,tag:{Fireworks:{Explosions:[{Colors:[I;16711680,255]}]}}}}`);
                })
            }
        }

        activeArena.teams = [];
        activeArena.players = [];
        activeArena.active = 0;
        saveArenaData(activeArena);

        // Replace all spawnpoints
        for(const spawn of activeArena.spawns){
            let block = server.overworld().getBlock(spawn.x, spawn.y, spawn.z);
            let team = TEAMS.find(t => t.name == spawn.team);
            if(!team) continue;

            block.set(team.spawnBlock);
        }
        showArenaScoreboard();
        return true;
    }
}

/**
 * Starts an arena
 * @param {*} arenaName 
 * @param {Internal.ServerPlayer} player 
 * @returns 
 */
function startArena(arenaName, player){
    let server = Utils.getServer();
    if(!server) return;

    let arena = getArenaData(arenaName);
    if(!arena) {
        player.tell("Arena not found!");
        return;
    }
    let gamemode = getArenaGamemode(arena);
    if(!gamemode){
        player.tell("Gamemode not found!");
        return;
    }

    if(arena.active > 0){
        player.tell("Arena is already active!");
        return;
    }

    let availablePlayers = getAvailablePlayers();
    let requiredTeams = gamemode.teams;
    for(const team of requiredTeams){
        let teamPlayers = availablePlayers.filter(p => {
            let pData = getPlayerData(p.username);
            if(!pData) return false;
            return pData.team == team.team;
        });

        let teamData = getTeam(team.team);
        if(teamPlayers.length < team.minPlayers){
            player.tell(`Not enough players in ${teamData.colorCode}Team ${team.team}§f! You need at least ${team.minPlayers} players! (Currently ${teamPlayers.length})`);
            return;
        }

        let spawnLocations = arena.spawns.filter(s => s.team == team.team);
        if(spawnLocations.length == 0){
            player.tell(`Not enough spawn locations for Team ${team.team}!`);
            return;
        }

        let teamName = initializeMinecraftTeam(teamData);

        arena.teams.push({
            team: team.team,
            givenMinecraftName: teamName
        });
    }
    
    currentColor = "§a";
    
    // Get all online players who are available to play
    let players = getAvailablePlayers();
    let playersAssignedToTeams = {};
    for(const player of players){
        let pData = getPlayerData(player.username);
        if(!pData) continue;
        let team = pData.team;
        let gamemodeTeam = gamemode.teams.find(t => t.team == team);
        if(!gamemodeTeam) continue;
        if(team){
            if(gamemodeTeam.maxPlayers > 0){
                if (!playersAssignedToTeams[team]) playersAssignedToTeams[team] = 0;
                if(playersAssignedToTeams[team] >= gamemodeTeam.maxPlayers){
                    player.tell(`You won't participate in the arena because Team ${team} was full!`);
                    continue;
                }
            }
            server.runCommandSilent(`team join ${pData.team} ${player.username}`);
        }else{
            continue;
        }
        pData.currentDeaths = 0;
        pData.deathStreak = 0;
        pData.killStreak = 0;
        pData.currentKills = 0;
        pData.points = 0;
        pData.arena = arenaName;
        arena.players.push(player.getStringUuid());
        playersAssignedToTeams[team]++;
        savePlayerData(player, pData);
    }

    // Set gamerules
    server.runCommandSilent(`gamerule doImmediateRespawn true`);
    server.runCommandSilent(`gamerule keepInventory true`);
    server.runCommandSilent(`gamerule showDeathMessages true`);
    // Turn off hunger
    server.runCommandSilent(`gamerule naturalRegeneration false`);

    arena.active = Date.now();
    saveArenaData(arena);

    for(const team of requiredTeams){
        let minecraftTeam = arena.teams.find(t => t.team == team.team);
        // Teleport players to their spawn
        server.runCommandSilent(`kill @a[team=${minecraftTeam.givenMinecraftName}]`);

        // Message the teams
        server.runCommandSilent(`title @a[team=${minecraftTeam.givenMinecraftName}] actionbar "§cYou're Team ${minecraftTeam.team}!"`);
    }
    // Send a title
    server.runCommandSilent(`title @a title "§aArena ${arenaName} started!"`);
    // server.runCommandSilent(`title @a subtitle "Kill everyone or be killed!"`);

    // Start a bossbar
    server.runCommandSilent(`bossbar add 0 "arena"`);
    server.runCommandSilent(`bossbar set minecraft:0 name "${arenaName}" in progress!`);
    server.runCommandSilent(`bossbar set minecraft:0 visible true`);
    server.runCommandSilent(`bossbar set minecraft:0 color green`);
    server.runCommandSilent(`bossbar set minecraft:0 value 100`);
    server.runCommandSilent(`bossbar set minecraft:0 max 100`);
    server.runCommandSilent(`bossbar set minecraft:0 style notched_6`);
    server.runCommandSilent(`bossbar set minecraft:0 players @a`);

    // Replace all spawnpoints to their original block
    for(const spawn of arena.spawns){
        let block = server.overworld().getBlock(spawn.x, spawn.y, spawn.z);
        block.set(spawn.original_block);
    }
    return true;
}


/**
 * Finds and returns the currently active arenas
 * @returns {Array<ArenaData>|undefined}
 */
function getActiveArenas(){
    let arenas = getAllArenas();
    if(!arenas) return;
    return arenas.filter((a)=>a.active > 0)
}


// Death events during an active arena
EntityEvents.death((event)=>{
    let deadPlayer =  event.server.getPlayer(event.entity.username);
    if(!deadPlayer) return;
    let killerPlayer = event.source?.player;
    let deadData = getPlayerData(deadPlayer.username)
    if(!deadData || !deadData.arena) return;

    // If the player was not killed by a player
    // or they killed themselves
    if(!killerPlayer || deadPlayer.username === killerPlayer.username) return

    // Get the arena data
    let activeArena = getArenaData(deadData.arena);
    if(!activeArena) return;
    
    
    let deadTeamData = getTeam(deadData.team);
    if(deadTeamData){
        event.server.runCommandSilent(`execute at @a run particle minecraft:end_rod ${deadPlayer.x} ${deadPlayer.y} ${deadPlayer.z} 0.5 0.5 0.5 0 100 normal @a`);
        event.server.runCommandSilent(`execute at @a run playsound minecraft:entity.arrow.hit_player master @a ${deadPlayer.x} ${deadPlayer.y} ${deadPlayer.z} 1 1 1`);
    }

    let killerTeamData = getTeam(getPlayerData(killerPlayer.username).team);
    
    deadData.deaths++;
    deadData.currentDeaths++;
    deadData.deathStreak++;
    
    deadData.lastSelectedSlot = deadPlayer.selectedSlot;
    if(deadData.deathStreak > 4){
        print(`${deadTeamData.colorCode}${deadPlayer.username} §8is on a §c${deadData.deathStreak} §8death streak!`)
    }
    
    let killerData = getPlayerData(killerPlayer.username);
    if(deadData.killStreak > 2){
        print(`§a${activeArena.name} §2> §f${killerTeamData?.colorCode}${killerPlayer.username} §fended ${deadTeamData.colorCode}${deadPlayer.username}§f's kill streak of §a${deadData.killStreak}§f!`)
        event.server.runCommandSilent(`playsound minecraft.entity.lightning_bolt.thunder master @a`)
    }else{
        print(`§a${activeArena.name} §2> §f${killerTeamData?.colorCode}${killerPlayer.username} §fkilled ${deadTeamData.colorCode}${deadPlayer.username}`)
    }
    if(killerData){
        killerData.kills++;
        killerData.currentKills++;
        killerData.killStreak++;
        killerData.deathStreak = 0;
        killerData.points++;
        let missingHealth = 20 - Math.floor(killerPlayer.health);
        let regenerationDuration = Math.ceil(missingHealth * 1.2);
        event.server.runCommandSilent(`effect clear ${killerPlayer.username} minecraft:regeneration`);
        event.server.runCommandSilent(`effect give ${killerPlayer.username} minecraft:regeneration ${regenerationDuration} 1 true`);
        event.server.runCommandSilent(`playsound minecraft:entity.experience_orb.pickup master ${killerPlayer.username} ${deadPlayer.x} ${deadPlayer.y} ${deadPlayer.z}`);
        killerPlayer.displayClientMessage(`§aYou've killed ${deadPlayer.username}`, true);
        if(killerData.killStreak > 2){
            event.server.runCommandSilent(`title @a actionbar "${killerPlayer.username} is on a §a${killerData.killStreak} kill streak!"`);
            print(`${killerTeamData.colorCode}${killerPlayer.username} §ais on a §a${killerData.killStreak} §akill streak!`)
        }
    }

    deadData.killStreak = 0;
    savePlayerData(deadPlayer, deadData);
    savePlayerData(killerPlayer, killerData);
})

PlayerEvents.respawned((event)=>{
    try{
        let pData = getPlayerData(event.player.username);
        if(!pData || !pData.arena) return;
    
        if(pData.kit){
            giveKit(pData.kit, event.player);
        }
        
        let activeArena = getArenaData(pData.arena);
        if(!activeArena) return;
        // Check if the player should respawn in an arena
        let team = pData.team;
        if(!team) return;

        let availableSpawns = activeArena.spawns.filter(s => s.team == team);
        if(availableSpawns.length == 0) return;
        let spawn = availableSpawns[Math.floor(Math.random() * availableSpawns.length)];
        event.player.teleportTo(spawn.x + 0.5, spawn.y + 2, spawn.z + 0.5);

        let teamData = getTeam(team);
        if(teamData){
            event.server.runCommandSilent(`item replace entity ${event.player.username} armor.head with leather_helmet{display:{color:${teamData.decimalColor}},Unbreakable:1,AttributeModifiers:[{AttributeName:"generic.armor",Amount:15,Slot:head,Name:"generic.armor",UUID:[I;-124316,10165,22544,-20330]}]} 1`)
        }
        
        event.server.schedule(50, ()=>{
            event.player.setSelectedSlot(pData.lastSelectedSlot);
            event.player.setInvulnerable(false);
        })

    }catch(e){
        print(e)
    }
})

/**
 * Helper function for creating an arena with a name
 * @param {string} name 
 * @param {string} gamemode
 * @param {Internal.ServerPlayer} player
 * @returns 
 */
function createArena(name, gamemode, player){
    try{
        let arena = getArenaData(name);
        if(arena){
            player.tell('Arena already exists! Use /arena config to configure it.');
            return false;
        }

        let gamemodeData = GAMEMODES.find(g=>g.name.toLowerCase() == gamemode.toLowerCase());
        if(!gamemodeData){
            let gamemodes = GAMEMODES.map(g => `${g.colorCode}${g.name}§f`);
            player.tell('Gamemode not found! Application supports: ' + gamemodes.join(', '));
            return false;
        }
    
        /** @type {ArenaData} */
        let data =  {
            name: name,
            gamemode: gamemodeData.name
        };
        saveArenaData(data);
        data = getArenaData(name);
        return data;
    }catch(e){
        print(e)
        return false;
    }
}

/**
 * Deletes an Arena
 * @param {ArenaData} arena 
 * @param {Internal.ServerPlayer} player 
 */
function deleteArena(arena, player){
    let server = Utils.getServer();
    if(!server) return;
    let arenas = getAllArenas();
    let index = arenas.findIndex(a => a.name == arena.name);
    if(index == -1){
        player.tell('Arena not found!');
        return;
    }
    if(arena.active > 0){
        player.tell('Arena is currently active!');
        return;
    }
    arenas.splice(index, 1);
    // Replace all spawnpoints to their original block
    for(const spawn of arena.spawns){
        let block = server.overworld().getBlock(spawn.x, spawn.y, spawn.z);
        block.set(spawn.original_block);
    }
    server.persistentData.put("kath", {arenas: arenas});
    player.tell('Arena deleted!');

}

/**
 * Returns all arenas in an array
 * @returns {Array<ArenaData>}
 */
function getAllArenas(){
    let server = Utils.getServer();
    if(!server) return;
    let arenas = server.persistentData.get("kath").arenas;
    if(!arenas) return [];

    let initArenas = [];
    for(const arena of arenas){
        let initArena = getArenaData(arena.name);
        initArenas.push(initArena);
    }

    return initArenas;
}

/**
 * Gives the player the tools to configure an arena
 * @param {Internal.ServerPlayer} player 
 * @param {ArenaData} arena 
 */
function giveArenaTools(player, arena){ // TODO we can clean this up to be nicer
    let tools = [];
    let gamemode = getArenaGamemode(arena);
    if(!gamemode) return;
    for(const team of gamemode.teams){
        let teamData = getTeam(team.team);
        if(!teamData) continue;
        tools.push({
            item: teamData.teamMarkerItem,
            nbt:{
                display:{
                    Name: `{"text":"Spawn - ${arena}"}`,
                    Lore: [
                        `{"text":"Set ${teamData}'s Spawn Location"}`
                    ]
                },
                arena_tool:1,
                spawn:teamData.name,
                arena_name: arena.name
            }
        })
    }

    for(const tool of tools){
        player.give(tool);
    }

    player.give({
        item: "supplementaries:soap",
        nbt:{
            display:{
                Name: `{"text":"Arena Tool Clear Spawn - ${arena}"}`,
                Lore: [
                    `{"text":"Clear a spawn point"}`
                ]
            },
            arena_tool:1,
            clear_spawn:1,
            arena_name: arena
        }
    })
}

// Arena related command registry
ServerEvents.commandRegistry((event) => {
    let { commands: Commands, arguments: Arguments } = event;
    event.register(Commands.literal('arena') // The name of the command
        .requires(s => s.hasPermission(2)) // Check if the player has operator privileges
        // Create a new Arena
        .then(Commands.literal('create')
        .then(Commands.argument('gamemode', Arguments.STRING.create(event))
        .then(Commands.argument('name', Arguments.STRING.create(event))
            .executes(c => {
                let name = Arguments.STRING.getResult(c, 'name');
                let gamemode = Arguments.STRING.getResult(c, 'gamemode');
                try{
                    let res = createArena(name, gamemode,c.source.player);
                    if(res){
                        giveArenaTools(c.source.player, res);
                        return 1;
                    }else{
                        return 1;
                    }
                }catch(e){
                    c.source.player.tell('Something went wrong creating your arena.')
                }
            }
        ))))
        .then(Commands.literal('config')
        .then(Commands.argument('name', Arguments.STRING.create(event))
            .executes(c => {
                let name = Arguments.STRING.getResult(c, 'name');
                let arena = getArenaData(name);
                if(!arena){
                    c.source.player.tell('Arena not found!');
                    return 1;
                }

                giveArenaTools(c.source.player, arena);
                return 1
            }
        )))
        .then(Commands.literal('start')
        .then(Commands.argument('name', Arguments.STRING.create(event))
            .executes(c => {
                let name = Arguments.STRING.getResult(c, 'name');
                try{
                    let res = startArena(name, c.source.player);
                    return 1;
                }catch(e){
                    print(e)
                }
            }
        )))
        .then(Commands.literal('stop')
            .executes(c => {
                let res = stopActiveArena();
                if(res){
                    return 1;
                }else{
                    c.source.player.tell('No active arena found!');
                    return 1;
                }
            }
        ))
        .then(Commands.literal('clear-spawns')
        .then(Commands.argument('name', Arguments.STRING.create(event))
            .executes(c => {
                try{
                    let name = Arguments.STRING.getResult(c, 'name');
                    let arena = getArenaData(name);
                    if(!arena){
                        c.source.player.tell('Arena not found!');
                        return 1;
                    }
                    try{
                        for(let spawn of arena.spawns){
                            let block = c.source.server.overworld().getBlock(spawn.x, spawn.y, spawn.z);
                            block.set(spawn.original_block);
                        }
                    }catch(e){
                        print(e)
                        return 0
                    }
                    arena.spawns = [];
                    saveArenaData(name, arena);
                    c.source.player.tell('Spawns cleared!');
                    return 1
                }catch(e){
                    print(e)
                }
            }
        )))
        .then(Commands.literal('delete')
        .then(Commands.argument('name', Arguments.STRING.create(event))
            .executes(c => {
                let name = Arguments.STRING.getResult(c, 'name');
                let arena = getArenaData(name);
                deleteArena(arena, c.source.player);
                return 1;
            }
        )))
        .then(Commands.literal('list')
            .executes(c => {
                let arenas = getAllArenas();
                if(!arenas || arenas.length == 0) {
                    c.source.player.tell('No arenas found!');
                    return 1;
                }
                // Sort arenas by name
                arenas.sort((a,b) => a.name.localeCompare(b.name));
                c.source.player.tell('§2Arenas:');
                for(const arena of arenas){
                    let gamemode = getArenaGamemode(arena);
                    c.source.player.tell(`${gamemode?.colorCode}${arena.gamemode.toUpperCase()} §f${arena.name}`);
                }
                return 1;
            })
        )
        .then(Commands.literal('tp')
        .then(Commands.argument('name', Arguments.STRING.create(event))
            .executes(c => {
                let name = Arguments.STRING.getResult(c, 'name');
                let arena = getArenaData(name);
                if(!arena){
                    c.source.player.tell('Arena not found!');
                    return 1;
                }
                if(arena.spawns.length > 0){
                    let spawn = arena.spawns[0];
                    c.source.player.teleportTo(spawn.x+0.5, spawn.y+1, spawn.z+0.5);
                    return 1;
                }
                if(arena.corner1 || arena.corner2){
                    let corner1 = arena.corner1;
                    let corner2 = arena.corner2;
                    let x = Math.floor((corner1.x + corner2.x) / 2);
                    let z = Math.floor((corner1.z + corner2.z) / 2);
                    c.source.player.teleportTo(x, 100, z);
                    return 1;
                }

                c.source.player.tell('Couldn\'t teleport you to the Arena because no Spawns or Corners were set.');
                return 1;
            }
        )))
        .then(Commands.literal('rename')
        .then(Commands.argument('name', Arguments.STRING.create(event))
        .then(Commands.argument('newName', Arguments.STRING.create(event))
            .executes(c => {
                let name = Arguments.STRING.getResult(c, 'name');
                let newName = Arguments.STRING.getResult(c, 'newName');
                let arena = getArenaData(name);
                if(!arena){
                    c.source.player.tell('Arena not found!');
                    return 1;
                }

                let existingArena = getArenaData(newName);
                if(existingArena){
                    c.source.player.tell('Arena with that name already exists!');
                    return 1;
                }

                arena.name = newName;
                saveArenaData(arena);
                c.source.player.tell('Arena renamed!');
                return 1
            }
        ))))
    );
});

// Arena related right click events
// TODO turn it into helper functions so its cleaner and easier to read
BlockEvents.rightClicked((event) =>{
    if(!event.server) return;
    try{
        let player = event.player;
        let item = player.getMainHandItem();
        if(!item.nbt?.arena_tool) return;

        let block = event.getBlock();
        let arenaName = item.nbt.arena_name;
        let arena = getArenaData(arenaName);
        if(!arena){
            player.tell("An arena by this name wasnt found.")
            return;
        }

        if(arena.active > 0){
            player.tell('Arena is currently active!');
            return;
        }
        
        let corner = item.nbt.corner;
        if(corner){
            let x = block.x;
            let z = block.z;
    
            if(corner == 1){
                arena.corner1 = {x:x, z:z};
            }else{
                arena.corner2 = {x:x, z:z};
            }
    
            saveArenaData(arenaName, arena);
            player.tell(`Arena ${arenaName} corner ${corner} set to ${x}, ${z}!`)
        }

        let spawn = item.nbt.spawn;
        if(spawn){
            let foundTeam = TEAMS.find(t => t.name == spawn);
            if(!foundTeam) return;
            let x = block.x;
            let y = block.y;
            let z = block.z;

            // Check if a spawn by this coordinates already exists
            let foundSpawn = arena.spawns.find(s => s.x == x && s.y == y && s.z == z);
            let originalBlock = block.id;
            if(foundSpawn){
                if(foundSpawn.team == spawn){
                    return;
                }else{
                    originalBlock = foundSpawn.original_block;
                }
            }

            arena.spawns.push({
                x:x,
                y:y,
                z:z,
                team:spawn,
                original_block: originalBlock,
            });
            // Replace the block with concrete
            block.set(foundTeam.spawnBlock);
            
            player.displayClientMessage(`§aArena ${arenaName} ${spawn} spawn set to ${x}, ${y}, ${z}!`, true)
            saveArenaData(arenaName, arena);
        }

        let clearSpawn = item.nbt.clear_spawn;
        if(clearSpawn){
            let x = block.x;
            let y = block.y;
            let z = block.z;
            let foundSpawn = arena.spawns.find(s => s.x == x && s.y == y && s.z == z);
            if(foundSpawn){
                block.set(foundSpawn.original_block);
                arena.spawns = arena.spawns.filter(s => s.x != x || s.y != y || s.z != z);
                saveArenaData(arenaName, arena);
                player.displayClientMessage(`Spawn at ${x}, ${y}, ${z} cleared!`, true)
            }
        }
    }catch(e){
        Utils.server.tell(e)
    }
})

// If a spawn block has been destroyed, spawn it back
BlockEvents.broken((event)=>{
    try{
        let block = event.block;
        let arenas = getAllArenas();
        for(const arena of arenas){
            if(!arena.spawns) continue;
            let foundSpawn = arena.spawns.find(s => s.x == block.x && s.y == block.y && s.z == block.z);
            if(foundSpawn){
                let spawnBlock = TEAMS.find(t => t.name == foundSpawn.team).spawnBlock
                event.server.schedule(10, ()=>{
                    block.set(spawnBlock);
                })
                event.player.displayClientMessage(`§cYou need to clear the spawn in order to remove the block! Use /arena config`, true)
                break;
            }
        }
    }catch(e){
        print(e)
    }
})

// Global constant for how long an arena lasts for in miliseconds
const ARENA_TIMEOUT = 1000 * 60 * 5;

// Helper function to convert miliseconds to a readable text
function milisecondsToText(miliseconds){
    let seconds = Math.floor(miliseconds / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    let days = Math.floor(hours / 24);

    let timeUnits = [];
    if (days > 0) timeUnits.push(`${days} ${days > 1 ? 'days' : 'day'}`);
    if (hours % 24 > 0) timeUnits.push(`${hours % 24} ${hours % 24 > 1 ? 'hours' : 'hour'}`);
    if (minutes % 60 > 0) timeUnits.push(`${minutes % 60} ${minutes % 60 > 1 ? 'minutes' : 'minute'}`);
    if (seconds % 60 > 0) timeUnits.push(`${seconds % 60} ${seconds % 60 > 1 ? 'seconds' : 'second'}`);

    if (timeUnits.length > 1) {
        let lastUnit = timeUnits.pop();
        return `${timeUnits.join(', ')} and ${lastUnit}`;
    } else {
        return timeUnits[0] || 'Time Over!';
    }
}


// Tick event for arena related stuff
ServerEvents.tick((event)=>{
    if(event.server.tickCount % 20 !== 0) return;
    let server = Utils.getServer();
    if(!server) return;
    try{
        let activeArenas = getActiveArenas();
        for(const arena of activeArenas){
            activeArenaTickEvent(arena, server);
        }
    }catch(e){
        print(e)
    }
})

function activeArenaTickEvent(arena, server){
    showArenaScoreboard(arena);
    if(!arena) return;
    let timeLeft = ARENA_TIMEOUT - (Date.now() - arena.active);
    let percentage = timeLeft / ARENA_TIMEOUT * 100;
    if(timeLeft <= 0){
        stopActiveArena();
        return;
    }else{
        // Boss bar
        let color = currentColor;
        if(percentage <= 50 && currentColor !== "§e" && currentColor !== "§c"){
            // If its less than 50%, make it yellow
            server.runCommandSilent(`bossbar set minecraft:0 color yellow`);
            server.runCommandSilent(`execute as @a run playsound minecraft:block.note_block.bass master @s ~ ~ ~ 1 1 1`);
            color = "§e";
            currentColor = "§e";
        }else if(percentage <= 10 && currentColor !== "§c"){
            // If the time remaining is 10%, then make it red
            server.runCommandSilent(`bossbar set minecraft:0 color red`);
            server.runCommandSilent(`execute as @a run playsound minecraft:block.note_block.banjo master @s ~ ~ ~ 1 1 1`);
            color = "§c";
            currentColor = "§c";
        }
        server.runCommandSilent(`bossbar set minecraft:0 name "§fTime left: ${color}${milisecondsToText(timeLeft)}!"`);
        server.runCommandSilent(`bossbar set minecraft:0 value ${Math.round(timeLeft / ARENA_TIMEOUT * 100)}`);
    }
}

/**
 * Meant to be displayed every tick. Displays the current information on the server regarding Arena.s
 * @param {ArenaData} arena 
 * @returns 
 */
function showArenaScoreboard(arena){
    /**
     * @type {Array<ScoreboardLine>}
     */
    let lines = [
        {text:`No Arena is currently Active`, color: "white"},
        {text:`Start playing by using`, color: "white"},
        {text:`/arena start <arena>`, color: "gray"}
    ];
    
    // If there is an Arena active, display the current points.
    if(arena){
        lines = [
            {text:`Current Arena: ${arena.name || "None"}`},
            // `Time Left: ${milisecondsToText(ARENA_TIMEOUT - (Date.now() - arena.active))}`,
        ];
        // Scoreboard
        let points = getAllPlayerPoints();
        for(let point of points){
            let team = getTeam(getPlayerData(point.player.username).team);
            let color = "white"
            if(team){
                color = team.textColor;   
            }
            lines.push({text:`${point.name}: ${point.points} pts`, color: color});
        }
    }


    displayScoreboard({
        objective: "arena",
        displayName: "Arena",
        lines: lines,
        display: "sidebar"
    })
}