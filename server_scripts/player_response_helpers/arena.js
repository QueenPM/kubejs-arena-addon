


function prGetArenaFromName(player, arenaName){
    let arena = getArenaData(arenaName);
    if(!arena){
        player.tell('Arena not found!');
        return null;
    }

    return arena;
}

function prGetGamemodeFromName(player, gamemode){
    let gamemodeData = GAMEMODES.find(g => g.name.toLowerCase() == gamemode.toLowerCase());
    if(!gamemodeData){
        let gamemodes = GAMEMODES.map(g => `${g.colorCode}${g.name}§f`);
        player.tell('Gamemode not found! Gamemode options: ' + gamemodes.join(', '));
        return null;
    }

    return gamemodeData;
}
