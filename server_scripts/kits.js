/**
 * @typedef {Object} KitData
 * @property {string} name - The name of the kit
 * @property {string} displayName - Display name of the kit
 * @property {string} colorCode - The Minecraft Color Code for Text
 * @property {Array<KitItem>} items - Array of items to give the player
 */

/**
 * @typedef {Object} KitItem
 * @property {Internal.ItemStack} item
 * @property {number} slot
 */

/**
 * @typedef {Object} ItemData
 * @property {string} id - The Minecraft ID of the item
 * @property {number} count - The number of items
 * @property {string|undefined} nbt - The NBT data of the item
 */

/**
 * Deletes a kit from the server
 * @param {string} name
 * @param {Internal.ServerPlayer} player
*/
function deleteKit(name, player){
    try{
        let data = getPSData();
        if(!data) return;
        let kitIndex = data.kits.findIndex(k => k.name.toLowerCase() == name.toLowerCase());
        if(kitIndex == -1){
            player.displayClientMessage(Component.red('Invalid kit!'), true);
            return;
        }
        // Can't use splice. KubeJS doesnt like it. So use filter instead.
        data.kits = data.kits.filter(k => k.name.toLowerCase() != name.toLowerCase());
        savePSData(data);
        player.displayClientMessage(Component.green(`Kit ${name} deleted!`), true);
    }catch(e){
        print(e)
    }
}

// TODO Before a kit is applied, it should save the player's previous inventory and restore it when the kit is removed. The player's previous inventory should be restored after an arena has finished
/**
 * Saves a kit to the server
 * @param {string} name
 * @param {Internal.ServerPlayer} player 
 */
function saveKit(name, player){
    // Check for reserved names
    const reserved = ["create", "save", "load"];
    if(reserved.some(r => r == name.toLowerCase())){
        player.displayClientMessage(Component.red('Invalid kit name! - Reserved name'), true);
        return;
    }
    let data = getPSData();
    if(!data) return;
    let items = player.inventory.getAllItems();
    if(items.length == 0){
        player.displayClientMessage(Component.red('Invalid kit! - No items in inventory'), true);
        return;
    }

    /**
     * @type {Array<KitItem>} itemsToSave
     */
    let itemsToSave = [];
    let slotLimit = player.inventory.getSlots();
    for(let i = 0; i < slotLimit; i++){
        let item = player.inventory.getStackInSlot(i);
        if(item.id != "minecraft:air"){
            print(`${i} ${item}`)
            itemsToSave.push({
                item: {
                    id: item.id,
                    count: item.count||1,
                    nbt: item.nbt
                },
                slot: i
            });
        }
    }
    let kit = {
        name: name.toLowerCase(),
        displayName: name,
        items:itemsToSave
    }

    // If a kit by this name already exists, replace it.
    let kitIndex = data.kits.findIndex(k => k.name.toLowerCase() == name.toLowerCase());
    if(kitIndex != -1){
        data.kits[kitIndex] = kit;
    }else{
        data.kits.push(kit);
    }
    savePSData(data);
    player.displayClientMessage(Component.green(`Kit ${name} saved!`), true);
}

/**
 * Gives a player a kit.
 * @param {string} name 
 * @param {Internal.ServerPlayer} player 
 * @returns {boolean} True/False on the success of the operation.
 */
function giveKit(name, player){
    const pData = getPlayerData(player);
    if(!pData) return false;
    const sData = getPSData();
    if(!sData) return false;
    let foundKit = sData.kits.find(k => k.name.toLowerCase() == name.toLowerCase());
    if(!foundKit) return false;
    let items = foundKit.items
    player.inventory.clear();
    for(const item of items){
        try{
            let slot = item.slot;

            let location = "";
            if(slot < 36){
                location = `container.${slot}`
            }else{
                switch(slot){
                    case 36: location = "armor.feet"; break;
                    case 37: location = "armor.legs"; break;
                    case 38: location = "armor.chest"; break;
                    case 39: location = "armor.head"; break;
                    case 40: location = "weapon.offhand"; break;
                    default: location = `inventory.${slot}`;
                }
            }
            let command = `item replace entity ${player.username} ${location} with ${item.item.id}${item.item.nbt?`${item.item.nbt}`:""} ${item.item.count||1}`
            player.server.runCommandSilent(command)
        }catch(e){
            print(e)
        }
    }
    pData.kit = foundKit.name;
    savePlayerData(player, pData);
    return true;
}


// Kit Commands
ServerEvents.commandRegistry((event) => {
    const { commands: Commands, arguments: Arguments } = event;
    event.register(Commands.literal('kit') // The name of the command
    .then(Commands.argument('name', Arguments.STRING.create(event))
        .executes(c => {
            const kit = Arguments.STRING.getResult(c, 'name');
            let result = giveKit(kit, c.source.player);
            if(result){
                c.source.player.displayClientMessage(Component.white('You\'ve selected the kit: ').append(Component.yellow(kit)), true);
            }else{
                c.source.player.displayClientMessage(Component.red('Invalid kit!'), true);
            }
            return 1
        }))
    .then(Commands.literal('save')
        .requires(s => s.hasPermission(2))
        .then(Commands.argument('name', Arguments.STRING.create(event))
            .executes(c => {
                const name = Arguments.STRING.getResult(c, 'name');
                saveKit(name, c.source.player);
                return 1;
            })
        ))
    .then(Commands.literal('delete')
    .requires(s => s.hasPermission(2))
        .then(Commands.argument('name', Arguments.STRING.create(event))
            .executes(c => {
                const name = Arguments.STRING.getResult(c, 'name');
                try{
                    deleteKit(name, c.source.player);
                }catch(e){
                    print(e)
                }
                return 1;
            })
        ))
    );

    event.register(Commands.literal('kits')
        .executes(c => {
            let data = getPSData();
            if(!data) return;
            let kits = data.kits
            if(kits.length > 0){
                c.source.player.tell(kits.map(k=>k.displayName||k.name).join('\n'))
            }else{
                c.source.player.tell('No kits saved!')
            }
            return 1
        })
    );

    event.register(Commands.literal('unkit')
        .executes(c => {
            const pData = getPlayerData(c.source.player);
            if(!pData) return;
            c.source.player.inventory.clear()
            delete pData.kit
            savePlayerData(c.source.player, pData);
            c.source.player.displayClientMessage(Component.red('You\'ve unselected your kit!'), true);
            return 1
        })
    );
});

//EntityEvents.death((event)=>{
//    const sourcePlayer = event.source.getPlayer()
//   if(!sourcePlayer) return;
//
//    let pointAwarded = 0;
//
//    // If its a player kill, award 50
//    if(event.entity.entityType == "player"){
//        pointAwarded = 50;
//    }else{
//        pointAwarded = 10;
//    }
//
//    try{
//        event.entity.playSound("minecraft:entity.experience_orb.pickup")
//        sourcePlayer.displayClientMessage(Component.yellow(`+$${pointAwarded}`),true);
//    }catch(e){
//        print(e)
//    }
//})