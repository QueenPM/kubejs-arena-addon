/**
 * @typedef {Object} ScoreboardData
 * @property {string} objective - Name of the scoreboard. No Spaces. This is used as an identifier in Minecraft
 * @property {string} displayName - Display Name of the scoreboard.
 * @property {string[]} lines - Array of lines to display on the scoreboard.
 * @property {"belowName"|"list"|"sidebar"} display - Minecraft setdisplay
 * @property {string} teamColor - For sidebar usage, if you want to restrict it to a team
 */


// /**
//  * @type {Array<ScoreboardData>}
//  */
// let scoreboardsTracked = [];

/**
 * 
 * @param {ScoreboardData} scoreboard 
 */
function displayScoreboard(scoreboard){
    try{
        let server = Utils.getServer();
        if(!server) return;
        let objective = scoreboard.objective;
        scoreboard.lines =  scoreboard.lines.reverse();

        let commands = [
            `scoreboard objectives remove ${objective}`
        ];

        if(scoreboard.display == "sidebar" && scoreboard.teamColor){
            scoreboard.display = `sidebar.team.${scoreboard.teamColor}`
        }
    
        commands.push(`scoreboard objectives add ${objective} dummy [{"text":"${scoreboard.displayName}"}]`);
        commands.push(`scoreboard objectives setdisplay ${scoreboard.display} ${objective}`);
        let uniqueLastCharacters = [];
        for(let i = 0; i < scoreboard.lines.length; i++){
            let line = scoreboard.lines[i].trim();
            let lastCharacter = '';
            let index = 1;
            do {
                lastCharacter = line.slice(-index);
                index++;
                if (index > line.length) {
                    throw new Error(`Unable to find unique identifier for line: "${line}"`);
                }
            } while (uniqueLastCharacters.includes(lastCharacter));
            uniqueLastCharacters.push(lastCharacter);
            let teamName = `${objective}${i}`;
            commands.push(`scoreboard players set ${lastCharacter} ${objective} ${i}`);
            commands.push(`team add ${teamName}`);
            commands.push(`team join ${teamName} ${lastCharacter}`);
            commands.push(`team modify ${teamName} color white`);
            commands.push(`team modify ${teamName} prefix {"text":"${line.substring(0, line.length - index + 1)}"}`);
        }
    
        for(const cmd of commands){
            server.runCommandSilent(cmd);
        }
    }catch(e){
        print(e)
    }
}

function hideScoreboard(objective){
    let server = Utils.getServer();
    if(!server) return;
    server.runCommandSilent(`scoreboard objectives remove ${objective}`)
}