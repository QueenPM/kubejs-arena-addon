// TODO Turn the tools and right-clicking of items into a helper function that both this and the arena spawn scripts can use
// Clean up both functions to be more modular and easier to read
// Also all of this logic can probably go into teams.js - its more appropriate there
/**
 * 
 * @param {Internal.ServerPlayer} player 
 */
function giveSpawnTools(player){
    for(const team of TEAMS){
        player.give({
            item: team.teamMarkerItem,
            nbt:{
                display:{
                    Name: `{"text":"Spawn Tool - Team ${team.name}"}`,
                    Lore: [
                        `{"text":"${team.name} Team Designation"}`
                    ]
                },
                spawn_tool:1,
                team:team.name,
            }
        })
    }
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
        let originalBlock = block.id;
        if(team){
            let foundTeam = TEAMS.find(t => t.name == team);
            if(!foundTeam) return;
            let x = block.x;
            let y = block.y;
            let z = block.z;

            // Check if a spawn by this coordinates already exists
            let foundSpawn = serverData.teamDesignationBlocks.find(s => s.x == x && s.y == y && s.z == z);;
            if(foundSpawn){
                if(foundSpawn.team == team){
                    return;
                }else{
                    originalBlock = foundSpawn.original_block;
                    serverData.teamDesignationBlocks = serverData.teamDesignationBlocks.filter(s => s.x != x || s.y != y || s.z != z);
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
            block.set(foundTeam.teamPlatform);
            
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
            }else{
                serverData.teamDesignationBlocks.push({
                    x:Math.floor(x),
                    y:Math.floor(y),
                    z:Math.floor(z),
                    team:"noteam",
                    original_block: originalBlock,
                });
                // Replace the block with concrete
                block.set("securitycraft:reinforced_white_stained_glass");
                
                player.displayClientMessage(`Leave Team Block set to ${x}, ${y}, ${z}!`, true)
                savePSData(serverData);
            }
        }
    }catch(e){
        Utils.server.tell(e)
    }
})