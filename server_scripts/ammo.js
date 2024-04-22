/**
 * Refills a player with an inventory of ammo for 3x a stack of each weapon they have
 * @param {Internal.ServerPlayer} player 
 */
function refillAmmo(player){
    let inventory = player.inventory.getAllItems();
    let typesOfAmmoNeeded = [];
    let alreadyHasAmmo = {};

    for(const item of inventory){
        let ammoAmount = AMMO.find(a => a.ammoId == item.id);
        if(ammoAmount){
            if(!alreadyHasAmmo[item.id]) alreadyHasAmmo[item.id] = 0;
            alreadyHasAmmo[item.id] += item.count;
            continue;
        }
        let ammoNeeded = null;
        for(const ammo of AMMO){
            if(!ammo.weapons) continue;
            for(const weapon of ammo.weapons){
                if(weapon == item.id){
                    ammoNeeded = ammo;
                    break;
                }
            }
        }
        if(!ammoNeeded) continue;

        if(!typesOfAmmoNeeded.includes(ammoNeeded.ammoId)){
            typesOfAmmoNeeded.push(ammoNeeded.ammoId);
        }
    }

    if(typesOfAmmoNeeded.length == 0){
        player.tell('You have all the ammo you need');
        return;
    }

    for(const ammo of typesOfAmmoNeeded){
        let amount = 5 * AMMO.find(a => a.ammoId == ammo).stackSize;
        if(alreadyHasAmmo[ammo]){
            amount -= alreadyHasAmmo[ammo];
        }
        if(amount > 0){
            player.server.runCommandSilent(`give ${player.username} ${ammo} ${amount}`);
            player.tell(`Refilled ${amount} of ${ammo}`);
        }
    }
}

ServerEvents.commandRegistry(e=>{
    let { commands: Commands, arguments: Arguments } = e;
    e.register(Commands.literal('ammo')
            .executes(c => {
                let player = c.source.player;
                let data = getPlayerData(player.username);
                if(!data) return;
                if(data.arena){
                    player.tell('You cannot refill ammo while in an arena');
                    return 1;
                }
                refillAmmo(player);
                return 1
            }
        ))
    }
)