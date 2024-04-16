/**
 * Class to help with Custom Scoreboards
 * https://www.digminecraft.com/game_commands/scoreboard_command.php
 */
class CustomScoreboard{
    /**
     * @param {string} objective Name of the scoreboard. No Spaces. This is used as an identifier in Minecraft
     * @param {string} displayName Display Name of the scoreboard.
     * @param {string[]} lines Array of lines to display on the scoreboard.
     */
    constructor(objective, displayName,lines = []){
        this.objective = objective;
        this.lines = lines;
        this.displayName = displayName
    }

    /**
     * Create the scoreboard on the Minecraft Server
     */
    createScoreboard(){
        let server = Utils.getServer();
        if(!server) return;
        server.runCommandSilent(`scoreboard objectives add ${this.objective} dummy ${this.displayName}`)
    }

    /**
     * 
     * @param {"belowName"|"list"|"sidebar"} display - Minecraft setdisplay
     * @returns 
     */
    setDisplay(display){
        let server = Utils.getServer();
        if(!server) return;
        server.runCommandSilent(`scoreboard objectives setdisplay ${display} ${this.objective}`)
    }
}