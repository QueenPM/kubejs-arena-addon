/**
 * @typedef {Object} KitData
 * @property {string} name - The name of the kit
 * @property {string} colorCode - The Minecraft Color Code for Text
 * @property {Array<Internal.ItemStack>} items - Array of items to give the player
 */

/**
 * @type {Array<KitData>}
 */
// TODO this array should be dynamic and let server operators add their own kits, saved in the server data.
const KITS = [
    {
        name: "Shotgun",
        colorCode: '§c',
        items: [
            {
                item: "cgm:shotgun",
                count: 1,
                nbt:{
                    AmmoCount: 8
                }
            },
            {
                item: "cgm:shell",
                count: 64
            }
        ]
    },
    {
        name: "Rifle",
        colorCode: '§6',
        items: [
            {
                item: "cgm:pistol",
                count: 1,
                nbt:{
                    AmmoCount: 16
                }
            },
            {
                item: "cgm:basic_bullet",
                count: 64
            }
        ]
    }
]

/**
 * Gives a player a kit.
 * @param {Internal.LivingEntity} player 
 * @param {string} kitName 
 * @returns {boolean} True/False on the success of the operation.
 */
function giveKit(player, kitName){
    const pData = getPlayerData(player);
    if(!pData) return false;
    let foundKit = KITS.find(shop => shop.name.toLowerCase() == kitName.toLowerCase());
    if(!foundKit) return false;
    let items = foundKit.items
    player.inventory.clear()
    items.forEach(item => {
        player.give(item)
    })
    pData.kit = kitName;
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
            let result = giveKit(c.source.player, kit)
            if(result){
                c.source.player.displayClientMessage(Component.white('You\'ve selected the kit: ').append(Component.yellow(kit)), true);
            }else{
                c.source.player.displayClientMessage(Component.red('Invalid kit!'), true);
            }
            return 1
        })
    ));

    event.register(Commands.literal('kits')
        .executes(c => {
            let kits = KITS.map(shop => shop.name)
            c.source.player.displayClientMessage(Component.white('Available Kits: ').append(Component.yellow(kits.join(', '))), true);
            return 1
        })
    );

    event.register(Commands.literal('unkit')
        .executes(c => {
            const pData = getPlayerData(c.source.player);
            if(!pData) return;
            c.source.player.inventory.clear()
            pData.kit = null;
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