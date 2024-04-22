# kubejs Arena Script

This project is a script for the Minecraft Modpack [Kath.gg Arena](www.curseforge.com) using [KubeJS Mod](https://kubejs.com/).

This script is used to create a custom arena for the modpack. Features include:
- Create and Manage Arenas
- Designate random spawn locations for Arenas
- Create Kits for players to use in Arenas

### Prerequisites

- Minecraft Verion 1.19+
- KubeJS Mod with either Forge or Fabric

### Installation

Copy this folder's contents into your `kubejs` folder in your Minecraft instance.

### ProbeJS

The git repo does not come included with probejs files. I recommend getting the [ProbeJS Mod](https://www.curseforge.com/minecraft/mc-mods/probejs) mod and the [ProbeJS Extension](https://marketplace.visualstudio.com/items?itemName=Prunoideae.probejs) for a better development experience.

## Usage
### Available gamemodes
 - TDM
 - FFA
### Arena Commands (Needs OP)
- `/arena create <gamemode> <arena_name>` - This will create a new arena with the name you provided. You'll be given Tools with which you can designate Team Spawns, Player Spawns, and the Arena's boundaries.

**Note:** Arena data is stored in the persistent data of the world and players.
- `/arena start <arena_name> <gamemode>` - This will start the Arena, teleporting all participating players. To participate in an Arena, see [**Teams**](#teams)
- `/arena delete <arena_name>` - This will delete the arena and all of its data.
- `/arena list` - This will list all the arenas in the world.
- `/arena tp <arena_name>` - This will teleport you to the arena's center or a random spawn location.
- `/arena clear-spawns <arena_name>` - This will clear all spawns inside the Arena
- `/arena rename <old_name> <new_name>` - Renames an arena

- `/arena gamemodes add <arena_name> <gamemode>` - Adds a gamemode to the Arena. An Arena can support multiple gamemodes this way
- `/arena gamemdodes remove <arena_name> <gamemode>` - Removes a gamemode from the Arena. An Arena must always have at least one gamemode to be playable
- `/arena gamemodes list <arena_name>` - Lists all gamemodes currently applied to the Arena,

### Teams
- `/team-arena join <Blue/Red>` - Joins either Team Blue/Red. You need to be a part of a team to participate in an Arena.
- `/team-arena leave`- Leaves your current team.

- `/spawn tools` - Gives you tools to designate locations for when players enter, they will automatically be assigned to Team Red/Blue. Useful for Lobbies/Hubs
### Kits
- `/kit <kit_name>` - Clear's the player's inventory and gives them the kit's contents. This assigns them the kit and they'll get the kit contents back everytime they respawn.
- `/kit save <kit_name>` - Saves your current inventory as a kit. If a kit already exists, it will be replaced.
- `/kit delete <kit_name>` - Deletes a kit.
- `/unkit` - Clears the player's inventory and removes the kit.

## License

This project is licensed under the MIT License