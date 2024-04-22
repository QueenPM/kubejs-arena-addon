/**
 * @typedef {Object} Ammo
 * @property {string} name - The name of the ammo
 * @property {string} ammoId - The minecraft ID of the ammo
 * @property {string} stackSize - The stack size of the ammo
 * @property {string[]} weapons - The weapons that use this ammo
 */


/**
 * @type {Ammo[]}
 */
const AMMO = [
    {
        name: "Basic Bullet",
        ammoId:"cgm:basic_bullet",
        stackSize:64,
        weapons:["cgm:pistol", "cgm:minigun", "cgm:assault_rifle", "cgm:machine_pistol", "cgm:heavy_rifle", "nzgmaddon:revoler", "nzgmaddon:uzi", "nzgmaddon:submachine_gun", "nzgmaddon:rapid_smg"]
    },
    {
        name: "Advanced Bullet",
        ammoId:"cgm:advanced_bullet",
        stackSize:64,
        weapons:["cgm:rifle", "nzgmaddon:hunting_rifle", "nzgmaddon:sniper_rifle"]
    },
    {
        name: "Shell",
        ammoId:"cgm:shell",
        stackSize:64,
        weapons:["cgm:shotgun", "nzgmaddon:pump_shotgun", "nzgmaddon:hunting_shotgun", "nzgmaddon:double_barreled_shotgun", "nzgmaddon:automatic_shotgun"]
    },
    {
        name: "Missile",
        ammoId:"cgm:missile",
        stackSize:64,
        weapons:["cgm:bazooka"]
    },
    {
        name: "Medium Bullets",
        ammoId:"nzgmaddon:medium_bullet",
        stackSize:64,
        weapons:["nzgmaddon:battle_rifle", "nzgmaddon:machine_gun", "nzgmaddon:infanty_rifle", "nzgmaddon:automatic_sniper_rifle", "nzgmaddon:bolt_action_rifle"]
    },
    {
        name: "Grenade",
        ammoId:"cgm:granade",
        stackSize:64,
        wepaons:["cgm:granade_launcher"]
    },
    {
        name: "Arrow",
        ammoId:"minecraft:arrow",
        stackSize:64,
        weapons:["minecraft:bow", "minecraft:crossbow"]
    },
]