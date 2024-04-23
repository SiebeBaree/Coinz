'use client';

import { useState } from 'react';
import Image from 'next/image';
import CategoryCard from '@/components/category-card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Fuse from 'fuse.js';
import Search from '@/components/Search';
import { Item } from '@prisma/client';

const categories: { [key: string]: string } = {
    all: 'All Items',
    tools: 'Tools',
    crops: 'Crops',
    animals: 'Animals',
    fish: 'Fish',
    rare_items: 'Rare Items',
    other: 'Other',
};

export default function ItemsSection({ items }: { items: Item[] }) {
    const [category, setCategory] = useState(Object.keys(categories)[0]);
    const [searchTerm, setSearchTerm] = useState('');
    const [visibleItems, setVisibleItems] = useState(items);
    const [selectedItem, setSelectedItem] = useState(items[0]);

    const fuse = new Fuse(items, {
        keys: ['name', 'itemId'],
    });

    const updateCategory = (cat: string) => {
        setCategory(cat);
        updateVisibleItems(cat, searchTerm);
    };

    const updateVisibleItems = (cat: string, searchQuery: string) => {
        let newItems = items;

        if (searchQuery.length > 1) {
            setCategory('all');
            const searchResults = fuse.search(searchQuery);
            newItems = searchResults.map((result) => result.item);
        } else if (cat !== 'all') {
            newItems = newItems.filter((shopItem) => shopItem.category === cat);
        }

        setVisibleItems(newItems);

        if (newItems.length === 0) {
            setSelectedItem(items[0]!);
            return;
        }

        if (selectedItem !== newItems[0]) {
            setSelectedItem(() => newItems[0]!);
        }
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                <div className="flex flex-wrap items-center gap-3">
                    {Object.keys(categories).map((name) => (
                        <CategoryCard
                            key={name}
                            name={categories[name]!}
                            value={name}
                            selectedCategory={category!}
                            setCategory={updateCategory}
                        />
                    ))}
                </div>

                <Search
                    placeholder="Search items..."
                    searchTerm={searchTerm}
                    onChangeHandler={(e) => {
                        setSearchTerm(e.target.value);
                        updateVisibleItems(category!, e.target.value);
                    }}
                />
            </div>

            <div className="mt-6 flex flex-col-reverse lg:flex-row items-start justify-between gap-3 relative h-full">
                <div className="flex flex-wrap gap-3">
                    {visibleItems.map((item) => (
                        <ItemCard
                            key={item.itemId}
                            item={item}
                            setItem={setSelectedItem}
                            isSelected={selectedItem?.itemId === item.itemId}
                        />
                    ))}
                </div>

                {selectedItem && (
                    <div className="lg:sticky lg:top-4 min-w-full lg:min-w-[400px] lg:max-w-[400px] bg-secondary px-6 py-8 rounded-lg">
                        <div className="flex gap-6">
                            <Image
                                src={`https://cdn.discordapp.com/emojis/${selectedItem.emoteId}.webp?size=96&quality=lossless`}
                                alt={selectedItem.name}
                                width={96}
                                height={96}
                                className="select-none"
                            />

                            <div className="flex flex-col gap-1">
                                <h2 className="text-2xl font-bold">{selectedItem.name}</h2>
                                <div className="text-muted font-medium flex gap-1 items-center">
                                    <p>Item ID:</p>
                                    <Badge variant="secondary" className="bg-background">
                                        {selectedItem.itemId}
                                    </Badge>
                                </div>
                                <div className="text-muted font-medium flex gap-1 items-center">
                                    <p>Category:</p>
                                    <Badge variant="secondary" className="bg-background">
                                        {categories[selectedItem.category]}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <p className="text-muted mt-4 border-l-2 pl-4 border-primary">
                            {selectedItem.longDescription ?? selectedItem.description}
                        </p>

                        <div className="mt-4 flex justify-around">
                            <div className="flex flex-col items-center gap-1">
                                <h3 className="text-xl font-bold">Buy Price</h3>
                                <div className="flex gap-2 items-center">
                                    {selectedItem.buyPrice ? (
                                        <>
                                            <Image
                                                src="https://cdn.discordapp.com/emojis/987800268223709254.webp?size=24&quality=lossless"
                                                alt="Coinz Currency"
                                                width={24}
                                                height={24}
                                            />
                                            <p>{selectedItem.buyPrice}</p>
                                        </>
                                    ) : (
                                        <p>Not Buyable</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-1">
                                <h3 className="text-xl font-bold">Sell Price</h3>

                                <div className="flex gap-2 items-center">
                                    {selectedItem.sellPrice ? (
                                        <>
                                            <Image
                                                src="https://cdn.discordapp.com/emojis/987800268223709254.webp?size=24&quality=lossless"
                                                alt="Coinz Currency"
                                                width={24}
                                                height={24}
                                            />
                                            <p>{selectedItem.sellPrice}</p>
                                        </>
                                    ) : (
                                        <p>Not Sellable</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// eslint-disable-next-line no-unused-vars
function ItemCard({ item, isSelected, setItem }: { item: Item; isSelected?: boolean; setItem: (_: Item) => void }) {
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <div
            onClick={() => setItem(item)}
            className={cn(
                isSelected ? 'border-primary' : 'border-transparent',
                'relative bg-secondary rounded-md select-none p-4 cursor-pointer border-[3px] transition-all duration-200 ease-in-out',
            )}
        >
            {!isLoaded && (
                <>
                    <Skeleton className="w-full h-full z-20 absolute top-0 left-0" />
                    <div className="w-full h-full absolute z-10 bg-secondary rounded-md top-0 left-0"></div>
                </>
            )}

            <Image
                src={`https://cdn.discordapp.com/emojis/${item.emoteId}.webp?size=56&quality=lossless`}
                alt={item.name}
                width={52}
                height={52}
                priority={false}
                loading="lazy"
                quality={90}
                onLoad={() => setIsLoaded(true)}
                className="w-10 h-10 md:w-[52px] md:h-[52px] transition-all duration-300 ease-in-out"
            />
        </div>
    );
}
