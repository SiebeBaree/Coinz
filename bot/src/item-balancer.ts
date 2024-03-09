type ItemData = {
    name: string;
    amount: number;
    sellPrice: number;
    duration: number;
    priceToProduce: number;
};

const data: ItemData[] = [
    {
        name: 'CPU',
        amount: 2,
        sellPrice: 150,
        duration: 32,
        priceToProduce: 80,
    },
    {
        name: 'RAM',
        amount: 2,
        sellPrice: 45,
        duration: 8,
        priceToProduce: 25,
    },
    {
        name: 'Screen',
        amount: 2,
        sellPrice: 90,
        duration: 22,
        priceToProduce: 20,
    },
    {
        name: 'Engine',
        amount: 1,
        sellPrice: 1000,
        duration: 72,
        priceToProduce: 25 * 5 + 35 * 12,
    },
    {
        name: 'Power Cell',
        amount: 4,
        sellPrice: 55,
        duration: 18,
        priceToProduce: 80,
    },
    {
        name: 'Electric Car',
        amount: 1,
        sellPrice: 10_000,
        duration: 336,
        priceToProduce: 2000 + 40 * 55 + 20 * 20 + 2 * 150,
    },
    {
        name: 'Server',
        amount: 1,
        sellPrice: 2000,
        duration: 96,
        priceToProduce: 2 * 150 + 12 * 45,
    },
    {
        name: 'Computer',
        amount: 1,
        sellPrice: 1100,
        duration: 56,
        priceToProduce: 150 + 4 * 45 + 20 * 8,
    },
    {
        name: 'Smartphone',
        amount: 1,
        sellPrice: 600,
        duration: 24,
        priceToProduce: 150 + 45 + 90 + 3 * 8 + 55,
    },
];

for (const item of data) {
    const itemsPerWeek = (7 * 24) / item.duration;
    const profitPerWeek = itemsPerWeek * item.sellPrice * item.amount - itemsPerWeek * item.priceToProduce;

    console.log(
        `${item.name}:\n- 1 factory: ${Math.floor(itemsPerWeek)}x ${Math.floor(profitPerWeek)}\n- 8 factories: ${Math.floor(itemsPerWeek * 8 * item.amount)}x ${Math.floor(
            profitPerWeek * 8,
        )}\n- 10 factories: ${Math.floor(itemsPerWeek * 10 * item.amount)}x ${Math.floor(profitPerWeek * 10)}\n`,
    );
}
