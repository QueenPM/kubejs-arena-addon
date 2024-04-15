function print(text){
    Utils.server.tell(text)
}

const SHOPS = [
    {
        name: "Shotgun",
        color: '§c',
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
        color: '§6',
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

// const DebugItem = {
//     item: "minecraft:stick",
//     nbt: {
//         display: {
//             Name: `{"text":"Kath"}`
//         }
//     }
// }

// function checkDebugItem(item){
//     if(item.nbt?.display?.Name){
//         if(item.id.toString() == "minecraft:stick") return true;
//     }
//     return false;
// }

// ItemEvents.rightClicked((event)=>{
//     if(!checkDebugItem(event.player.getMainHandItem())) return;
    
//     for(const shopItem of SHOPS){
//         let spawnEggNBT = {
//             display: {
//                 Name: `{"text":"${shopItem.name}"}`
//             },
//             EntityTag: {
//                 id: "minecraft:chicken",
//                 Age: -2147483648,
//                 DeathLootTable: "",
//             }
//         };

//         event.player.give({
//             item: "minecraft:chicken_spawn_egg",
//             count: 1,
//             nbt: spawnEggNBT
//         });
//     }
// })

// EntityEvents.spawned((event)=>{
//     let entityName = event.entity.customName ? event.entity.customName.getString() : null
//     if(event.entity.type != "minecraft:chicken" || !entityName) return;
//     let tags = event.entity.getTags()
//     if (tags.contains("shop")) return;
//     let foundShopEntity;
//     for(const shop of SHOPS){
//         if(shop.name == entityName){
//             foundShopEntity = shop
//             break;
//         }
//     }

//     if(!foundShopEntity) return;


//     event.entity.kill()

//     event.server.runCommandSilent(`execute in ${event.entity.level.dimension} positioned ${event.entity.x} ${event.entity.y} ${event.entity.z} run summon minecraft:chicken ~ ~ ~ {CustomName:'{"text":"${entityName}"}', NoAI:1b, DeathLootTable:'', Health:1f, rewardExp:false, Age:-2147483648, Tags:["shop"]}`);
// })

// EntityEvents.death((event)=>{
//     try{
//         let playerSource = event.source.getPlayer()
//         if(!playerSource) return;
//         let entityName = event.entity.customName ? event.entity.customName.getString() : null


//         if(!event.entity.tags.contains("shop")) return;
//         if(event.entity.type != "minecraft:chicken" || !entityName) return;
//         let foundShopEntity;
//         for(const shop of SHOPS){
//             if(shop.name == entityName){
//                 foundShopEntity = shop
//                 break;
//             }
//         }
//         if(!foundShopEntity) return;

//         if (!checkDebugItem(playerSource.getMainHandItem())){
//             let items = foundShopEntity.items
//             // Clear the player's inventory

//             let playerInventoryItems = playerSource.inventory.getAllItems()
//             let removeItems = [];
//             // Remove the debug tool from the item list
//             for(const item of playerInventoryItems){
//                 if(item.nbt?.display?.Name){
//                     if(item.id.toString() == "minecraft:stick") continue;
//                 }
//                 removeItems.push(item)
//             }
//             playerSource.inventory.clear(removeItems)
    
//             // Give the player the items
//             items.forEach(item => {
//                 playerSource.give(item)
//             })
//             event.server.runCommandSilent(`execute in ${event.entity.level.dimension} positioned ${event.entity.x} ${event.entity.y} ${event.entity.z} run summon minecraft:chicken ~ ~ ~ {CustomName:'{"text":"${entityName}"}', NoAI:1b, DeathLootTable:'', Health:1f, rewardExp:false, Age:-2147483648, Tags:["shop"]}`);

//             print(`${foundShopEntity.color}${playerSource.username} chose ${entityName}!`)
//         }

//     }catch(e){
//         Utils.server.tell(e)
//     }
// })

function giveKit(player, kitName){
    const pData = getPlayerData(player);
    if(!pData) return;
    let foundKit = SHOPS.find(shop => shop.name.toLowerCase() == kitName.toLowerCase());
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
            let kits = SHOPS.map(shop => shop.name)
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