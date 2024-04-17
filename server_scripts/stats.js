ServerEvents.commandRegistry((event) => {
    let { commands: Commands, arguments: Arguments } = event;
    event.register(Commands.literal('stats')
        .then(Commands.argument('name', Arguments.STRING.create(event))
            .executes(c => {
                let name = Arguments.STRING.getResult(c, 'name');
                try{
                    /**
                     * @type {Internal.ServerPlayer}
                     */
                    let player = c.source.server.players.find(p => {
                        return p.name.string.toLowerCase() == name.toLowerCase()
                    });
                    if(!player){
                        c.source.player.tell("Player not found");
                        return 1;
                    }else{
                        let data = getPlayerData(player);
                        if(!data){
                            c.source.player.tell("No data found for this player");
                            return 1;
                        }
                        let winPercentage = (data.singleWins + data.teamWins) / data.arenaParticipation * 100;
                        let winPercentageColor;
                        if (winPercentage > 70) {
                            winPercentageColor = "§a"; // Green
                        } else if (winPercentage > 40) {
                            winPercentageColor = "§e"; // Yellow
                        } else {
                            winPercentageColor = "§c"; // Red
                        }
                        let lines = [
                            `§e${player.username}§6's Stats`,
                            `§2--Personal stats--`,
                            `§5KDR: §a${data.kills}§2/§c${data.deaths}§2/§6${(data.kills / data.deaths).toFixed(2)}`,
                            `§2--Arena stats--`,
                            `§5Arena Played: §f${data.arenaParticipation}`,
                            `§5Arena Wins: §a${data.singleWins+data.teamWins} §f(${winPercentageColor}${Math.round(winPercentage)}%§f)`,
                            `§5Single Wins: §a${data.singleWins}`,
                            `§5Team Wins: §a${data.teamWins}`,
                        ];
                        for(const line of lines){
                            c.source.player.tell(line);
                        }
                        return 1;
                    }
                }catch(e){
                    print(e)
                }
            }
        ))
    );
});