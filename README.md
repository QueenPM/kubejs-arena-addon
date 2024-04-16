# kubejs Arena Script

This project is a script for the Minecraft Modpack [Kath.gg Arena](www.curseforge.com) using KubeJS Mod.

This script is used to create a custom arena for the modpack. Features include:
- Create and Manage Arenas
- Designate random spawn locations for Arenas
- Create Kits for players to use in Arenas

### Prerequisites

- Minecraft Verion 1.19+
- KubeJS Mod with either Forge or Fabric

### Installation

All you need to do is copy this folder's contents into your `kubejs` folder in your Minecraft instance.

## Usage
### Arena Commands (Needs OP)
- `/arena create <arena_name>` - This will create a new arena with the name you provided. You'll be given Tools with which you can designate Team Spawns, Player Spawns, and the Arena's boundaries.

**Note:** Arena data is stored in the persistent data of the world and players.

- `/arena start <arena_name>` - This will start the Arena, teleporting all participating players. To participate in an Arena, see [**Teams**](#teams)
- `/arena delete <arena_name>` - This will delete the arena and all of its data.
- `/arena list` - This will list all the arenas in the world.
- `/arena tp <arena_name>` - This will teleport you to the arena's center or a random spawn location.
- `/arena clear-spawns <arena_name>` - This will clear all spawns inside the Arena

### Teams
- `/team-arena join <Blue/Red>` - Joins either Team Blue/Red. You need to be a part of a team to participate in an Arena.
- `/team-arena leave`- Leaves your current team.

- `/spawn tools` - Gives you tools to designate locations for when players enter, they will automatically be assigned to Team Red/Blue. Useful for Lobbies/Hubs
### Kits
- `/kit <kit_name>` - Clear's the player's inventory and gives them the kit's contents. This assigns them the kit and they'll get the kit contents back everytime they respawn.
- `/unkit` - Clears the player's inventory and removes the kit.

## License

This project is licensed under the MIT License