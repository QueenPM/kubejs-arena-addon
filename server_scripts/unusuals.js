const UNUSUALS = {
    ash:{
        effects: [
            {id:'minecraft:ash', count: 10, spread: "0.1 0.1 0.1", speed: 0},
        ],
        timer: 5,
        radius: 0.5,
        rotationSpeed: 8
    },
    splash:{
        effects: [
            {id:'minecraft:bubble', count: 5, spread: "0.1 0.1 0.1", speed: 0.1},
        ],
        timer: 1,
        radius: 0.3,
        rotationSpeed: 4
    },
    crown:{
        effects: [
            {id:'minecraft:wax_on', count: 1, spread: "0 0 0", speed: 0},
        ],
        timer: 1,
        radius: 0.3,
        rotationSpeed: 20,
        offsetY: 0
    },
    heart:{
        effects: [
            {id:'minecraft:heart', count: 1, spread: "0 0 0", speed: 0},
            {id:'minecraft:cloud', count: 3, spread: "0 0 0", speed: 0},
        ],
        timer: 5,
        radius: 0.5,
        rotationSpeed: 7,
        offsetY: 0.5
    },
    new:{
        effects: [
            {id:'minecraft:cloud', count: 1, spread: "0 0 0", speed: 0},
        ],
        timer: 5,
        radius: 0.4,
        rotationSpeed: 7,
    },
}

const PI = 3.14159;

const equipped = [
    {
        name: "QueenPM",
        effect: "crown"
    },
    {
        name: "UnknownLady",
        effect: "heart"
    },
    {
        name: "AxolDyci",
        effect: "ash"
    },
    {
        name: "RustyS",
        effect: "splash"
    }
]

PlayerEvents.tick((event) => {
    let player = event.player;
    let data = getPlayerData(player.username);
    if(!data || data.arena) return;
    let found = equipped.find(e => e.name == player.username);
    if(!found) return;
    let unusual = UNUSUALS[found.effect];
    if(!unusual) return;

    let effects = unusual.effects;
    let timer = unusual.timer;
    if (event.server.getTickCount() % timer != 0) return;

    let radius = unusual.radius;
    let angle = (event.server.getTickCount() * unusual.rotationSpeed % 360) * PI / 180; // Convert to radians
    let x = player.x + radius * Math.cos(angle);
    let z = player.z + radius * Math.sin(angle);

    for(const effect of effects){
        let command = `execute as ${event.player.username} run particle ${effect.id} ${x} ${player.y + 2 + (unusual.offsetY || 0)} ${z} ${effect.spread} ${effect.speed} ${effect.count} normal`;
        event.server.runCommandSilent(command);
    }
});