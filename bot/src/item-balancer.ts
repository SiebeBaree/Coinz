type ItemData = {
    name: string;
    amount: number;
    buyPrice?: number;
    itemPrice: number;
    sellPrice: number;
    duration: number;
};

const data: ItemData[] = [
    {
        name: 'shirt',
        amount: 3,
        itemPrice: 45,
        sellPrice: 21,
        duration: 2,
    },
    {
        name: 'sneakers',
        amount: 2,
        itemPrice: 75,
        sellPrice: 53,
        duration: 4,
    },
    {
        name: 'propeller',
        amount: 4,
        itemPrice: 98,
        sellPrice: 35,
        duration: 6,
    },
    {
        name: 'power cell',
        amount: 3,
        itemPrice: 290,
        sellPrice: 133,
        duration: 18,
    },
    {
        name: 'cpu',
        amount: 2,
        itemPrice: 160,
        sellPrice: 118,
        duration: 12,
    },
    {
        name: 'laptop',
        amount: 1,
        itemPrice: 5 * 8 + 50 + 160 + 290,
        sellPrice: 750,
        duration: 36,
    },
    // {
    //     name: 'drone',
    //     amount: 1,
    //     itemPrice: 870,
    //     sellPrice: 960,
    //     duration: 24,
    // },
    // {
    //     name: 'smartphone',
    //     amount: 1,
    //     itemPrice: 480,
    //     sellPrice: 600,
    //     duration: 24,
    // },
    // {
    //     name: 'solar panel',
    //     amount: 1,
    //     itemPrice: 245,
    //     sellPrice: 310,
    //     duration: 48,
    // },
    // {
    //     name: 'engine',
    //     amount: 1,
    //     itemPrice: 820,
    //     sellPrice: 1_000,
    //     duration: 72,
    // },
    // {
    //     name: 'electric car',
    //     amount: 1,
    //     itemPrice: 3_870,
    //     sellPrice: 4_200,
    //     duration: 120,
    // },
];

console.log("Balancing items' buy prices...");
for (const item of data) {
    const itemsPerWeek = (7 * 24) / item.duration;
    const profitPerWeek = itemsPerWeek * item.sellPrice * item.amount;
    const netProfitPerWeek = profitPerWeek - itemsPerWeek * item.itemPrice;
    const profitWithItemsBoughtPerWeek = profitPerWeek * (item.buyPrice ?? 0);

    console.log(
        `${item.name}:\n- 1 factory: ${Math.floor(itemsPerWeek)}x ${Math.floor(netProfitPerWeek)} (${Math.floor(
            profitWithItemsBoughtPerWeek,
        )})\n- 9 factories: ${Math.floor(itemsPerWeek * 9 * item.amount)}x ${Math.floor(
            netProfitPerWeek * 9,
        )} (${Math.floor(profitWithItemsBoughtPerWeek * 9)})\n- 12 factories (PRO): ${Math.floor(
            itemsPerWeek * 12 * item.amount,
        )}x ${Math.floor(netProfitPerWeek * 12)} (${Math.floor(profitWithItemsBoughtPerWeek * 12)})\n`,
    );
}
