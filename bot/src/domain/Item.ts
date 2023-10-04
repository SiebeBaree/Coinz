export default interface Item {
    itemId: string;
    category: string;
    name: string;
    emoteId: string;
    description: string;
    longDescription?: string;
    buyPrice?: number;
    sellPrice?: number;
    multiplier?: number;
    duration?: number;
}