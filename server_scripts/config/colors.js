/**
 * @typedef {Object} Color
 * @property {string} name
 * @property {string} hex
 * @property {{r:number, g:number, b:number}} rgb
 * @property {string} chatCode
 * @property {number} decimal
 * @property {string} motdCode
 */

/**
 * @type {Color[]}
 */
const colors = [
    {
        name: "white",
        hex: "#FFFFFF",
        rgb: { r: 255, g: 255, b: 255 },
        chatCode: "§f",
        decimal: "16777215",
        motdCode: "\u00A7f"
    },
    {
        name: "black",
        hex: "#000000",
        rgb: { r: 0, g: 0, b: 0 },
        chatCode: "§0",
        decimal: "0",
        motdCode: "\u00A70"
    },
    {
        name: "dark_blue",
        hex: "#0000AA",
        rgb: { r: 0, g: 0, b: 170 },
        chatCode: "§1",
        decimal: "170",
        motdCode: "\u00A71"
    },
    {
        name: "dark_green",
        hex: "#00AA00",
        rgb: { r: 0, g: 170, b: 0 },
        chatCode: "§2",
        decimal: "43520",
        motdCode: "\u00A72"
    },
    {
        name: "dark_aqua",
        hex: "#00AAAA",
        rgb: { r: 0, g: 170, b: 170 },
        chatCode: "§3",
        decimal: "43690",
        motdCode: "\u00A73"
    },
    {
        name: "dark_red",
        hex: "#AA0000",
        rgb: { r: 170, g: 0, b: 0 },
        chatCode: "§4",
        decimal: "11141120",
        motdCode: "\u00A74"
    },
    {
        name: "dark_purple",
        hex: "#AA00AA",
        rgb: { r: 170, g: 0, b: 170 },
        chatCode: "§5",
        decimal: "11141290",
        motdCode: "\u00A75"
    },
    {
        name: "gold",
        hex: "#FFAA00",
        rgb: { r: 255, g: 170, b: 0 },
        chatCode: "§6",
        decimal: "16755200",
        motdCode: "\u00A76"
    },
    {
        name: "gray",
        hex: "#AAAAAA",
        rgb: { r: 170, g: 170, b: 170 },
        chatCode: "§7",
        decimal: "11184810",
        motCode: "\u00A77"
    },
    {
        name: "dark_gray",
        hex: "#555555",
        rgb: { r: 85, g: 85, b: 85 },
        chatCode: "§8",
        decimal: "5592405",
        motdCode: "\u00A78"
    },
    {
        name: "blue",
        hex: "#5555FF",
        rgb: { r: 85, g: 85, b: 255 },
        chatCode: "§9",
        decimal: "5592575",
        motdCode: "\u00A79"
    },
    {
        name: "green",
        hex: "#55FF55",
        rgb: { r: 85, g: 255, b: 85 },
        chatCode: "§a",
        decimal: "5635925",
        motdCode: "\u00A7a"
    },
    {
        name: "aqua",
        hex: "#55FFFF",
        rgb: { r: 85, g: 255, b: 255 },
        chatCode: "§b",
        decimal: "5636095",
        motdCode: "\u00A7b"
    },
    {
        name: "red",
        hex: "#FF5555",
        rgb: { r: 255, g: 85, b: 85 },
        chatCode: "§c",
        decimal: "16733525",
        motdCode: "\u00A7c"
    },
    {
        name: "light_purple",
        hex: "#FF55FF",
        rgb: { r: 255, g: 85, b: 255 },
        chatCode: "§d",
        decimal: "16733695",
        motdCode: "\u00A7d"
    },
    {
        name: "yellow",
        hex: "#FFFF55",
        rgb: { r: 255, g: 255, b: 85 },
        chatCode: "§e",
        decimal: "16777045",
        motdCode: "\u00A7e"
    }
]

/**
 * Helper function to get colors
 * @param {string} name
 * @returns 
 */
function getColorByName(name) {
    let color = colors.find(color => color.name === name)
    if(color) return color;
    return colors[0]
}