// priority: 0

// ServerEvents.loaded(()=>{
//     global.kills = {}
// })

// EntityEvents.death((event)=>{
//     try{
//         let playerSource = event.source.getPlayer()
//         if(!playerSource) return;
//         let entity = event.entity.type.split(":")[1].replace("_", " ")

//         Utils.server.tell(`§6${playerSource.username} killed a ${entity}!`)
//     }catch(e){
//         Utils.server.tell(e)
//     }
// })

// PlayerEvents.death((event)=>{
//     try{
//         let playerSource = event.source.getPlayer()
//         if(!playerSource) return;

//         Utils.server.tell(`§c${playerSource.username} ⚔ ${event.entity.username}`)
//     }catch(e){
//         Utils.server.tell(e)
//     }
// })