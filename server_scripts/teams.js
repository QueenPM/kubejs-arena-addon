/**
 * @typedef {Object} TeamData
 * @property {string} name - The name of the team
 * @property {string} colorCode - The Minecraft Color Code for Text
 * @property {number} decimalColor - The decimal color code. Used for fireworks & other things
 * @property {string} block - Unused. This was used for right clicking to get a team. Might be re-used in the future. Perhaps replace the Team Designation blocks with this.
 * @property {string} spawnBlock - Minecraft Block ID for the block to be used for Team Spawns
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
        decimalColor: 255,
        block: "minecraft:blue_wool",
        spawnBlock: "minecraft:blue_concrete"
    },
    {
        name: "Red",
        colorCode: "§c",
        decimalColor: 16711680,
        block: "minecraft:red_wool",
        spawnBlock: "minecraft:red_concrete"
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
        let pData = getPlayerData(p);
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
 * @param {boolean} teamCommandAssigned
 * @returns 
 */
function joinTeam(player, team, teamCommandAssigned){
    let pData = getPlayerData(player);
    if(!pData) return false;
    let foundTeam = TEAMS.find(t => t.name.toLowerCase() == team.toLowerCase());
    if(!foundTeam) return false;
    if(getActiveArena()){
        player.tell('You can\'t join a team while an Arena is active!');
        return false;
    }
    
    if(pData.team === foundTeam.name){
        return 1;
    }else{
        let server = Utils.getServer();
        if(!server) return;
        
        // Create the minecraft team
        let teamName = foundTeam.name
        let teamColor = foundTeam.colorCode;
        server.runCommandSilent(`team add ${teamName}`);
        server.runCommandSilent(`team modify ${teamName} color ${teamColor}`);
        
        pData.team = foundTeam.name;
        if(!teamCommandAssigned) teamCommandAssigned = false;
        pData.teamCommandAssigned = teamCommandAssigned;
        savePlayerData(player, pData);

        player.displayClientMessage(`${foundTeam.colorCode}You'll be participating as ${team}!`, true)
        let msg = `${foundTeam.colorCode}${player.username} has joined Team ${foundTeam.name}!`;
        notifyTeamPlayers(foundTeam, msg);
        return foundTeam;
    }
}

/**
 * Leave a team
 * @param {Internal.ServerPlayer} player 
 * @param {boolean} teamCommandAssigned
 */
function leaveTeam(player, teamCommandAssigned){
    let pData = getPlayerData(player);
    if(!pData) return;
    let server = Utils.getServer();
    if(!server) return;
    let team = pData.team;
    if(!team) return;
    
    if(!teamCommandAssigned) teamCommandAssigned = false;
    server.runCommandSilent(`team join Spawn ${player.username}`);
    pData.team = null;
    pData.teamCommandAssigned = teamCommandAssigned;
    savePlayerData(player, pData);
    
    player.displayClientMessage(`You've left your team and won't participate in the Arenas`, true)
    let msg = `${player.username} has left Team ${team}!`;
    notifyTeamPlayers(team, msg);
    if(getActiveArena()){
        server.runCommandSilent(`kill ${player.username}`);

    }
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
                    let result = joinTeam(c.source.player, name, true);
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
                let pData = getPlayerData(c.source.player);
                if(!pData) return;
                let server = Utils.getServer();
                if(!server) return;
                let team = pData.team;
                if(!team) {
                    c.source.player.tell('You\'re not on a team!');
                    return 1;
                }
                leaveTeam(c.source.player, true);
                return 1
            }
        ))
    );
});

// Change player team based on spawn blocks
PlayerEvents.tick((event) => {
    try{
        event.server.runCommandSilent(`effect give ${event.player.username} minecraft:saturation 1 255 true`)
    }catch(e){
        print(e)
    }
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