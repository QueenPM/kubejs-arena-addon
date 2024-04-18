/**
 * @typedef {Object} TeamData
 * @property {string} name - The name of the team
 * @property {string} textColor - The Minecraft Color Code for Text
 * @property {string} colorCode - The Minecraft Color Code for Text
 * @property {number} decimalColor - The decimal color code. Used for fireworks & other things
 * @property {string} block - Unused. This was used for right clicking to get a team. Might be re-used in the future. Perhaps replace the Team Designation blocks with this.
 * @property {string} spawnBlock - Minecraft Block ID for the block to be used for Team Spawns
 * @property {string} teamPlatform - Minecraft Block ID for the block to be used for Team Designation
 * @property {Array<string>} arenasActive - The names of the arenas that are currently active for this team
 */

/**
 * @type {Array<TeamData>}
 */
// TODO: a lot of team logic is hardcoded. All team related logic should work off of this array.
// This way, if we want to add more teams, we can just add them here and the rest of the code should work.
const TEAMS = [ 
    {
        name: "Blue",
        colorCode: "§9",
        textColor: "blue",
        decimalColor: 255,
        block: "minecraft:blue_wool",
        spawnBlock: "minecraft:blue_concrete",
        teamPlatform: "securitycraft:reinforced_blue_stained_glass",
        arenasActive: []
    },
    {
        name: "Red",
        colorCode: "§c",
        textColor: "red",
        decimalColor: 16711680,
        block: "minecraft:red_wool",
        spawnBlock: "minecraft:red_concrete",
        teamPlatform: "securitycraft:reinforced_red_stained_glass",
        arenasActive: []
    }
]
// TODO this probably doesnt get used in places where it needs to be.
// could probably remove it or replace it where its needed
function getTeam(team){
    return TEAMS.find(t => t.name.toLowerCase() == team.toLowerCase());
}

/**
 * Sends a message to all players part of the same team
 * @param {*} team 
 */
function notifyTeamPlayers(team, message){
    let server = Utils.getServer();
    if(!server) return;
    let players = server.getPlayers();
    let teamPlayers = players.filter(p => {
        let pData = getPlayerData(p.username);
        if(!pData) return false;
        return pData.team == team.name;
    });

    for(const player of teamPlayers){
        player.tell(message);
    }
}

/**
 * Join a team
 * @param {Internal.ServerPlayer} player 
 * @param {string} team 
 * @returns 
 */
function joinTeam(player, team){
    let pData = getPlayerData(player.username);
    if(!pData) return false;
    let foundTeam = TEAMS.find(t => t.name.toLowerCase() == team.toLowerCase());
    if(!foundTeam) return false;
    
    if(pData.team === foundTeam.name){
        return 1;
    }else{
        let server = Utils.getServer();
        if(!server) return;
        
        // Create the minecraft team
        let teamName = foundTeam.name
        server.runCommandSilent(`team add ${teamName}`);
        server.runCommandSilent(`team modify ${teamName} color ${foundTeam.textColor}`);
        
        pData.team = foundTeam.name;
        savePlayerData(player, pData);

        player.displayClientMessage(`${foundTeam.colorCode}You'll be participating as ${team}!`, true)
        // let msg = `${foundTeam.colorCode}${player.username} has joined Team ${foundTeam.name}!`;
        // notifyTeamPlayers(foundTeam, msg);
        return foundTeam;
    }
}

/**
 * Leave a team
 * @param {Internal.ServerPlayer} player 
 */
function leaveTeam(player){
    let pData = getPlayerData(player.username);
    if(!pData) return;
    let server = Utils.getServer();
    if(!server) return;
    let team = pData.team;
    if(!team) return;
    
    delete pData.team;
    server.runCommandSilent(`team join Spawn ${player.username}`);
    
    player.displayClientMessage(`You've left your team and won't participate in the Arenas`, true)
    // let msg = `${player.username} has left Team ${team}!`;
    // notifyTeamPlayers(team, msg);
    if(pData.arena){
        server.runCommandSilent(`kill ${player.username}`);
        delete pData.arena
    }
    savePlayerData(player, pData);
}


// Team related command resgistry
ServerEvents.commandRegistry((event) => {
    let { commands: Commands, arguments: Arguments } = event;
    event.register(Commands.literal('team-arena') // The name of the command
        // Join a team
        .then(Commands.literal('join')
            .then(Commands.argument('name', Arguments.STRING.create(event))
                .suggests((c, b) => {
                    for(const team of TEAMS){
                        b.suggest(team.name)
                    }
                    return b.build()
                })
                .executes(c => {
                    let name = Arguments.STRING.getResult(c, 'name');
                    let result = joinTeam(c.source.player, name);
                    if(typeof result == "object"){
                        return 1;
                    }else if(result === 1){
                        c.source.player.tell('You\'re already on that team!');
                        return 1;
                    }

                    c.source.player.tell('Invalid team!');
                    return 1;
                }
            )
        ))
        .then(Commands.literal('leave')
            .executes(c => {
                let pData = getPlayerData(c.source.player.username);
                if(!pData) return;
                let server = Utils.getServer();
                if(!server) return;
                let team = pData.team;
                if(!team) {
                    c.source.player.tell('You\'re not on a team!');
                    return 1;
                }
                leaveTeam(c.source.player);
                return 1
            }
        ))
    );
});


// Change player team based on spawn blocks
PlayerEvents.tick((event) => {
    if(event.server.getTickCount() % 20 != 0) return;
    let player = event.player;
    let server = event.server;
    try{
        server.runCommandSilent(`effect give ${player.username} minecraft:saturation 80 0 true`)
        let psData;
        try{
            psData = getPSData();
        }catch(e){
            console.log(e)
        }
        if(!psData) return;
        let playerData = getPlayerData(player.username);
        if(!playerData) return;
        if(playerData.arena) return; // Don't run if an arena is active
        if(!server) return;
    
        let blocks = psData.teamDesignationBlocks;
    
        // Check if the player is inside one of the blocks
        let playerX = Math.floor(player.x);
        let playerZ = Math.floor(player.z);
        let playerY = Math.floor(player.y);
    
        let foundBlock = blocks.find(b => {
            return b.x == playerX && b.z == playerZ;
        });
    
        
        if(foundBlock && foundBlock.y < playerY && playerY < foundBlock.y + 5){
            let team = foundBlock.team;
            if(!playerData.team || playerData.team != team){
                if(team == "noteam" && playerData.team){
                    leaveTeam(player);
                }else if(team != "noteam"){
                    joinTeam(player, team);
                }
            }
        }
    }catch(e){
        console.log(e)
    }
})