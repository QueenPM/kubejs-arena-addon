
// global var for the bossbar color. Used as a control to not spam the bossbar color change. Probably a better way to do this
let currentColor = "§a";

/**
 * Stops the currently active arena
 * @returns 
 */
function stopActiveArena(){
    let activeArena = getActiveArena();
    let server = Utils.getServer();
    if(activeArena && server){
        activeArena.active = 0;
        saveArenaData(activeArena);
        // Kill every player who has a team
        server.runCommandSilent(`kill @a[team=Red]`);
        server.runCommandSilent(`kill @a[team=Blue]`);
        
        // Summon a firework at everyone
        server.schedule(50, ()=>{
            server.runCommandSilent(`execute as @a run summon firework_rocket ~ ~ ~ {LifeTime:15,FireworksItem:{id:firework_rocket,Count:1,tag:{Fireworks:{Explosions:[{Colors:[I;16711680,255]}]}}}}`);
        })

        server.runCommandSilent(`title @a title "§aEvent has concluded!"`);
        server.runCommandSilent(`title @a subtitle "Goodjob everyone!"`);

        // Remove the scoreboard
        server.runCommandSilent(`scoreboard objectives remove kills`);
        server.runCommandSilent(`scoreboard objectives remove deathCount`);

        // Hide the bossbar
        server.runCommandSilent(`bossbar set minecraft:0 visible false`);

        // Give everyone the "Spawn" team
        server.runCommandSilent(`team join Spawn @a`);

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

    // // Check if the arena has both corners set
    // if(!arena.corner1 || !arena.corner2) return;

    // Check if the arena has spawns for at least two teams
    let redSpawns = arena.spawns.filter(s => s.team == "Red");
    let blueSpawns = arena.spawns.filter(s => s.team == "Blue");
    if(redSpawns.length == 0 || blueSpawns.length == 0){
        player.tell("Arena needs at least one spawn for each team!");
        return;
    }

    let activeArena = getActiveArena();
    if(activeArena){
        stopActiveArena();
    }

    currentColor = "§a";

    // Get all online players and iterate over their persistant data
    let players = server.getPlayers();
    for(const player of players){
        let pData = getPlayerData(player);
        if(!pData) continue;
        if(pData.team){
            server.runCommandSilent(`team join ${pData.team} ${player.username}`);
        }
    }

    // Set gamerules
    server.runCommandSilent(`gamerule doImmediateRespawn true`);
    server.runCommandSilent(`gamerule keepInventory true`);
    server.runCommandSilent(`gamerule showDeathMessages true`);
    // Turn off hunger
    server.runCommandSilent(`gamerule naturalRegeneration false`);

    arena.active = Date.now();
    saveArenaData(arena);

    // Teleport players to their spawn
    server.runCommandSilent(`kill @a[team=Red]`);
    server.runCommandSilent(`kill @a[team=Blue]`);

    // Hide display names
    server.runCommandSilent(`team modify Red nametagVisibility never`);
    server.runCommandSilent(`team modify Blue nametagVisibility never`);

    // Create a scoreboard to track player kills
    server.runCommandSilent(`scoreboard objectives add kills deathCount`);
    server.runCommandSilent(`scoreboard objectives setdisplay sidebar kills`);

    // Send a title
    server.runCommandSilent(`title @a title "§aArena ${arenaName} started!"`);
    // server.runCommandSilent(`title @a subtitle "Kill everyone or be killed!"`);

    server.runCommandSilent(`title @a[team=Red] actionbar "§cYou're Team Red!"`);
    server.runCommandSilent(`title @a[team=Blue] actionbar "§9You're Team Blue!"`);

    // Start a bossbar
    server.runCommandSilent(`bossbar add 0 "arena"`);
    server.runCommandSilent(`bossbar set minecraft:0 name "${arenaName}" in progress!`);
    server.runCommandSilent(`bossbar set minecraft:0 visible true`);
    server.runCommandSilent(`bossbar set minecraft:0 color green`);
    server.runCommandSilent(`bossbar set minecraft:0 value 100`);
    server.runCommandSilent(`bossbar set minecraft:0 max 100`);
    server.runCommandSilent(`bossbar set minecraft:0 style notched_6`);
    server.runCommandSilent(`bossbar set minecraft:0 players @a`);

    // Play some dumbass thing
    // server.runCommandSilent(`execute as @a run playsound alexsmobs:april_fools_music_box music @s ~ ~ ~ 1 1 1`)
    return true;
}


/**
 * Finds and returns the currently active arena
 * @returns {ArenaData|undefined}
 */
function getActiveArena(){
    let arenas = getAllArenas();
    if(!arenas) return;
    return arenas.find((a)=>a.active > 0)
}


// Death events during an active arena
EntityEvents.death((event)=>{
    let entity = event.entity;
    if(entity.type != "minecraft:player") return
    let activeArena = getActiveArena();
    if(!activeArena) return;

    let pData = getPlayerData(entity)
    if(!pData || !pData.team) return;

    // If it is an active Arena

    let teamData = getTeam(pData.team);
    if(teamData){
        event.server.runCommandSilent(`summon firework_rocket ${entity.x} ${entity.y} ${entity.z} {LifeTime:0,FireworksItem:{id:firework_rocket,Count:1,tag:{Fireworks:{Explosions:[{Colors:[I;${teamData.decimalColor}]}]}}}}`);
    }

    // If it was killed by a player, play a ding sound
    let source = event.source;
    if(source.type != "minecraft:player") return;
    source.player.playSound("minecraft:entity.experience_orb.pickup");

    pData.deaths++;
    savePlayerData(entity, pData);
    let killerData = getPlayerData(source.player);
    if(killerData){
        killerData.kills++;
        savePlayerData(source.player, killerData);
    }
})

PlayerEvents.respawned((event)=>{
    try{
        let pData = getPlayerData(event.player);
        if(!pData || !pData.team) return;
    
        if(pData.kit){
            giveKit(event.player, pData.kit);
        }
        
        let activeArena = getActiveArena();
        if(!activeArena) return;
        // Check if the player should respawn in an arena
        let team = pData.team;
        if(!team) return;

        let availableSpawns = activeArena.spawns.filter(s => s.team == team);
        if(availableSpawns.length == 0) return;
        let spawn = availableSpawns[Math.floor(Math.random() * availableSpawns.length)];
        event.player.teleportTo(spawn.x + 0.5, spawn.y + 2, spawn.z + 0.5);
    }catch(e){
        print(e)
    }
})

/**
 * Helper function for creating an arena with a name
 * @param {*} name 
 * @returns 
 */
function createArena(name){
    try{
        let arena = getArenaData(name);
        if(arena){
            return false;
        }
    
        /** @type {ArenaData} */
        let data =  {
            name: name,
            corner1: null,
            corner2: null,
            spawns: [],
            active: 0
        };

        saveArenaData(data);
        return data;
    }catch(e){
        print(e)
        return false;
    }
}

/**
 * Returns all arenas in an array
 * @returns {Array<ArenaData>}
 */
function getAllArenas(){
    let server = Utils.getServer();
    if(!server) return;
    return server.persistentData.get("kath").arenas;
}

/**
 * Gives the player the tools to configure an arena
 * @param {Internal.ServerPlayer} player 
 * @param {*} arenaName 
 */
function giveArenaTools(player, arenaName){ // TODO we can clean this up to be nicer
    player.give({
        item: "minecraft:red_dye",
        nbt:{
            display:{
                Name: `{"text":"Arena Tool Spawn - ${arenaName}"}`,
                Lore: [
                    `{"text":"Red Team Spawn"}`
                ]
            },
            arena_tool:1,
            spawn:"Red",
            arena_name: arenaName
        }
    })
    player.give({
        item: "minecraft:lapis_lazuli",
        nbt:{
            display:{
                Name: `{"text":"Arena Tool Spawn - ${arenaName}"}`,
                Lore: [
                    `{"text":"Blue Team Spawn"}`
                ]
            },
            arena_tool:1,
            spawn:"Blue",
            arena_name: arenaName
        }
    })
    player.give({
        item: "supplementaries:soap",
        nbt:{
            display:{
                Name: `{"text":"Arena Tool Clear Spawn - ${arenaName}"}`,
                Lore: [
                    `{"text":"Clear a spawn point"}`
                ]
            },
            arena_tool:1,
            clear_spawn:1,
            arena_name: arenaName
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
            .then(Commands.argument('name', Arguments.STRING.create(event))
                .executes(c => {
                    let name = Arguments.STRING.getResult(c, 'name');
                    try{
                        let res = createArena(name);
                        if(res){
                            giveArenaTools(c.source.player, name);
                            return 1;
                        }else{
                            c.source.player.tell('Arena already exists! Use /arena config to configure it.');
                            return 1;
                        }
                    }catch(e){
                        c.source.player.tell('Something went wrong creating your arena.')
                    }
                }
            )
        ))
        .then(Commands.literal('config')
            .then(Commands.argument('name', Arguments.STRING.create(event))
                .executes(c => {
                    let name = Arguments.STRING.getResult(c, 'name');
                    let arena = getArenaData(name);
                    if(!arena){
                        c.source.player.tell('Arena not found!');
                        return 1;
                    }

                    giveArenaTools(c.source.player, name);
                    return 1
                }
            )
        ))
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
            )
        ))
        .then(Commands.literal('stop')
            .executes(c => {
                let res = stopActiveArena();
                if(res){
                    c.source.player.tell('Arena stopped!');
                    return 1;
                }else{
                    c.source.player.tell('No active arena found!');
                    return 1;
                }
            })
        )
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
            )
        ))
        .then(Commands.literal('delete')
            .then(Commands.argument('name', Arguments.STRING.create(event))
                .executes(c => {
                    let name = Arguments.STRING.getResult(c, 'name');
                    let arenas = getAllArenas();
                    if(!arenas) {
                        c.source.player.tell('No arenas found!');
                        return 1;
                    }
                    if(arenas[name]){
                        delete arenas[name];
                        c.source.player.tell('Arena deleted!');
                        return 1;
                    }else{
                        c.source.player.tell('Arena not found!');
                    }
                }
            )
        ))
        .then(Commands.literal('list')
            .executes(c => {
                let arenas = getAllArenas();
                if(!arenas || arenas.length == 0) {
                    c.source.player.tell('No arenas found!');
                    return 1;
                }
                for(const arena of arenas){
                    c.source.player.tell(arena.name);
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
                    if(arena.corner1 || arena.corner2){
                        let corner1 = arena.corner1;
                        let corner2 = arena.corner2;
                        let x = Math.floor((corner1.x + corner2.x) / 2);
                        let z = Math.floor((corner1.z + corner2.z) / 2);
                        c.source.player.teleportTo(x, 100, z);
                        return 1;
                    }
                    if(arena.spawns.length > 0){
                        let spawn = arena.spawns[0];
                        c.source.player.teleportTo(spawn.x, spawn.y, spawn.z);
                        return 1;
                    }

                    c.source.player.tell('Couldn\'t teleport you to the Arena because no Spawns or Corners were set.');
                    return 1;
                }
            )
        ))
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
    let server = Utils.getServer();
    if(!server) return;
    try{
        let activeArena = getActiveArena();
        if(!activeArena) return;
    
        let timeLeft = ARENA_TIMEOUT - (Date.now() - activeArena.active);
        let percentage = timeLeft / ARENA_TIMEOUT * 100;
        if(timeLeft <= 0){
            stopActiveArena();
            return;
        }else{
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
    }catch(e){
        print(e)
    }
})

// Cancels death messages in favour for custom messages
EntityEvents.death((event)=>{
    event.cancel();
})