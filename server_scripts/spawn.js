function giveSpawnTools(player){
    player.give({
        item: "minecraft:red_dye",
        nbt:{
            display:{
                Name: `{"text":"Spawn Tool - Team Red"}`,
                Lore: [
                    `{"text":"Red Team Designation"}`
                ]
            },
            spawn_tool:1,
            team:"Red",
        }
    })
    player.give({
        item: "minecraft:lapis_lazuli",
        nbt:{
            display:{
                Name: `{"text":"Spawn Tool - Team Blue"}`,
                Lore: [
                    `{"text":"Blue Team Designation"}`
                ]
            },
            spawn_tool:1,
            team:"Blue",
        }
    })
    player.give({
        item: "supplementaries:soap",
        nbt:{
            display:{
                Name: `{"text":"Spawn Tool - Clear"}`,
                Lore: [
                    `{"text":"Clear a team point"}`
                ]
            },
            spawn_tool:1,
            clear_spawn:1,
        }
    })
}

ServerEvents.commandRegistry((event) => {
    let { commands: Commands, arguments: Arguments } = event;
    event.register(Commands.literal('spawn')
        .requires(s => s.hasPermission(2))
        .then(Commands.literal('tools')
        .executes(c => {
            giveSpawnTools(c.source.player);
            return 1;
        }
    ))
    );
});


// Change player team based on spawn blocks
PlayerEvents.tick((event) => {
    if(getActiveArena()) return; // Don't run if an arena is active
    if(!event.server) return;
    let psData = getPSData();
    if(!psData) return;

    let blocks = psData.teamDesignationBlocks;
    let player = event.player;

    // Check if the player is inside one of the blocks
    let playerX = Math.floor(player.x);
    let playerZ = Math.floor(player.z);

    let foundBlock = blocks.find(b => {
        return b.x == playerX && b.z == playerZ;
    });

    
    let playerData = getPlayerData(player);
    if(!playerData) return;
    if(foundBlock){
        let team = foundBlock.team;
        if(!playerData.team || playerData.team != team){
            joinTeam(player, team);
        }
    }else{
        if(playerData.team && !playerData.teamCommandAssigned){
            leaveTeam(player);
        }
    }
})

BlockEvents.rightClicked((event) =>{
    if(!event.server) return;
    let serverData = getPSData();
    if(!serverData) return;
    try{
        let player = event.player;
        let item = player.getMainHandItem();
        if(!item.nbt?.spawn_tool) return;
        let team = item.nbt.team;
        let block = event.block;
        if(team){
            let foundTeam = TEAMS.find(t => t.name == team);
            if(!foundTeam) return;
            let x = block.x;
            let y = block.y;
            let z = block.z;

            // Check if a spawn by this coordinates already exists
            let foundSpawn = serverData.teamDesignationBlocks.find(s => s.x == x && s.y == y && s.z == z);
            let originalBlock = block.id;
            if(foundSpawn){
                if(foundSpawn.team == team){
                    return;
                }else{
                    originalBlock = foundSpawn.original_block;
                }
            }

            serverData.teamDesignationBlocks.push({
                x:Math.floor(x),
                y:Math.floor(y),
                z:Math.floor(z),
                team:team,
                original_block: originalBlock,
            });
            // Replace the block with concrete
            block.set(foundTeam.spawn_block);
            
            player.displayClientMessage(`${foundTeam.colorCode}Team Block for ${team} set to ${x}, ${y}, ${z}!`, true)
            savePSData(serverData);
        }

        let clearSpawn = item.nbt.clear_spawn;
        if(clearSpawn){
            let x = block.x;
            let y = block.y;
            let z = block.z;
            let foundSpawn = serverData.teamDesignationBlocks.find(s => s.x == x && s.y == y && s.z == z);
            if(foundSpawn){
                block.set(foundSpawn.original_block);
                serverData.teamDesignationBlocks = serverData.teamDesignationBlocks.filter(s => s.x != x || s.y != y || s.z != z);
                savePSData(serverData);
                player.displayClientMessage(`Team Block at ${x}, ${y}, ${z} cleared!`, true)
            }
        }
    }catch(e){
        Utils.server.tell(e)
    }
})