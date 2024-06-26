/**
 * @typedef {Object} ScoreboardData
 * @property {string} objective - Name of the scoreboard. No Spaces. This is used as an identifier in Minecraft
 * @property {string} displayName - Display Name of the scoreboard.
 * @property {Array<ScoreboardLine>} lines - Array of lines to display on the scoreboard.
 * @property {"belowName"|"list"|"sidebar"} display - Minecraft setdisplay
 * @property {string} teamColor - For sidebar usage, if you want to restrict it to a team
 */

/**
 * @typedef {Object} ScoreboardLine
 * @property {string} text - Text to display
 * @property {string} color - Color to display it in
 */

/**
 * Helper function to display a scoreboard
 * @param {ScoreboardData} scoreboard 
 */
function displayScoreboard(scoreboard){
    try{
        let server = Utils.getServer();
        if(!server) return;
        let objective = scoreboard.objective;
        scoreboard.lines =  scoreboard.lines.reverse();

        // Remove the existing scoreboard + data
        let commands = [
            `scoreboard objectives remove ${objective}`
        ];

        // If the scoreboard if meant to be displayed for a specific team, then restrict it for them.
        if(scoreboard.display == "sidebar" && scoreboard.teamColor){
            scoreboard.display = `sidebar.team.${scoreboard.teamColor}`
        }
    
        // Create the scoreboard
        commands.push(`scoreboard objectives add ${objective} dummy [{"text":"${scoreboard.displayName}"}]`);
        commands.push(`scoreboard objectives setdisplay ${scoreboard.display} ${objective}`);

        // Create the individual lines for the scoreboard.
        let uniqueLastCharacters = [];
        for(let i = 0; i < scoreboard.lines.length; i++){
            let line = scoreboard.lines[i].text.trim();
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
            commands.push(`team modify ${teamName} color ${scoreboard.lines[i].color}`);
            commands.push(`team modify ${teamName} prefix {"text":"${line.substring(0, line.length - index + 1)}"}`);
        }
    
        for(const cmd of commands){
            server.runCommandSilent(cmd);
        }
    }catch(e){
        print(e)
    }
}

/**
 * Removes a scoreboard
 * @param {string} objective 
 * @returns 
 */
function hideScoreboard(objective){
    let server = Utils.getServer();
    if(!server) return;
    server.runCommandSilent(`scoreboard objectives remove ${objective}`)
}