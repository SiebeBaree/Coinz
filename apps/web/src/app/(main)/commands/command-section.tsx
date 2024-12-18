'use client';

import { useEffect, useRef, useState } from 'react';
import { cn, copyCode } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import CategoryCard from '@/components/category-card';
import Search from '@/components/Search';
import { ChevronDownIcon, MinusIcon, PlusIcon } from 'lucide-react';

type Command = {
    name: string;
    description: string;
    category: string;
    cooldown?: number | null;
    usage: string[];
    premium?: number | null;
};

const categories: { [key: string]: string } = {
    all: 'All',
    misc: 'Miscellaneous',
    general: 'General',
    games: 'Games',
    business: 'Business',
    investing: 'Investing',
};

function getCommands(commands: Command[], category: string, searchTerm: string) {
    if (searchTerm) {
        return commands.filter((command) => command.name.includes(searchTerm.replace('/', '')));
    } else if (category === 'all') {
        return commands;
    } else {
        return commands.filter((command) => command.category === category);
    }
}

function msToFormattedTime(duration: number): string {
    if (duration === 0) return '5 seconds';
    if (duration === 1) return '1 second';

    const days = Math.floor(duration / (60 * 60 * 24));
    const hours = Math.floor((duration % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((duration % (60 * 60)) / 60);
    const seconds = Math.floor(duration % 60);

    if (days === 0 && hours === 0 && minutes === 0) {
        return `${seconds} second${seconds === 1 ? '' : 's'}`;
    } else if (days === 0 && hours === 0 && seconds === 0) {
        return `${minutes} minute${minutes === 1 ? '' : 's'}`;
    } else if (days === 0 && minutes === 0 && seconds === 0) {
        return `${hours} hour${hours === 1 ? '' : 's'}`;
    } else if (hours === 0 && minutes === 0 && seconds === 0) {
        return `${days} day${days === 1 ? '' : 's'}`;
    }

    let result = '';
    if (days > 0) result += `${days}d `;
    if (hours > 0 || result.length > 0) result += `${hours}h `;
    if (minutes > 0 || result.length > 0) result += `${minutes}m `;
    if (seconds > 0 || result.length > 0) result += `${seconds}s`;
    return result || '0s';
}

export default function CommandSection({ commands }: { commands: Command[] }) {
    const [category, setCategory] = useState(Object.keys(categories)[0]!);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        copyCode();
    }, []);

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                <div className="flex flex-wrap items-center gap-3">
                    {Object.keys(categories).map((name) => (
                        <CategoryCard
                            key={name}
                            name={categories[name]!}
                            value={name}
                            selectedCategory={category!}
                            setCategory={setCategory}
                        />
                    ))}
                </div>

                <Search
                    placeholder="Search commands..."
                    searchTerm={searchTerm}
                    onChangeHandler={(e) => {
                        setSearchTerm(e.target.value);
                    }}
                />
            </div>

            <div className="flex flex-col gap-3 mb-12">
                {getCommands(commands, category, searchTerm).map((command) => (
                    <CommandCard command={command} key={command.name} />
                ))}
            </div>
        </div>
    );
}

function CommandCard({ command }: { command: Command }) {
    const [isOpen, setIsOpen] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.style.maxHeight = isOpen ? `${contentRef.current.scrollHeight}px` : '0';
        }
    }, [isOpen]);

    const coinzPlusCooldown = (command.cooldown || 0) <= 5 ? 1 : command.cooldown || 0;
    const coinzProCooldown = command.category === 'games' ? 240 : coinzPlusCooldown;

    return (
        <div
            className={cn(
                isOpen ? 'border-highlight' : 'border-1 border-transparent',
                'flex items-center gap-4 bg-secondary rounded-md px-3 py-1',
            )}
        >
            <div
                className="transition-all duration-300 ease-in-out hidden sm:block"
                style={{ transform: `rotate(${isOpen ? '180deg' : '0'})` }}
            >
                {isOpen ? (
                    <MinusIcon className="text-primary h-12 w-12" />
                ) : (
                    <PlusIcon className="text-primary h-12 w-12" />
                )}
            </div>
            <div className="flex flex-col justify-center flex-grow">
                <div
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        isOpen && 'pb-1',
                        'flex justify-between items-center gap-2 select-none cursor-pointer transition-transform duration-300 ease-in-out',
                    )}
                >
                    <div className="py-2">
                        <h4 className="font-semibold text-xl">/{command.name}</h4>
                        <p className="text-sm sm:text-base text-muted">{command.description}</p>
                    </div>
                    <ChevronDownIcon
                        className="text-primary h-12 w-12 transition-all duration-300 ease-in-out"
                        style={{
                            transform: `rotate(${isOpen ? '180deg' : '0'})`,
                        }}
                    />
                </div>

                <div
                    ref={contentRef}
                    className={cn(
                        isOpen && 'mb-1',
                        'max-h-0 overflow-hidden transition-all duration-300 ease-in-out flex flex-col gap-4',
                    )}
                >
                    <div className="flex items-center gap-2 border-t border-muted pt-3">
                        <Badge variant="secondary" className="bg-background">
                            {categories[command.category]}
                        </Badge>
                        {(command.premium || 0) > 0 && (
                            <>{command.premium === 1 ? <Badge>Coinz Plus</Badge> : <Badge>Coinz Pro</Badge>}</>
                        )}
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-1">Cooldown</h3>

                        {command.premium === 0 ? (
                            <div className="flex flex-col gap-1">
                                <span>
                                    Free: <Badge variant="outline">{msToFormattedTime(command.cooldown || 0)}</Badge>
                                </span>
                                <span>
                                    Coinz Plus: <Badge variant="outline">{msToFormattedTime(coinzPlusCooldown)}</Badge>
                                </span>
                                <span>
                                    Coinz Pro: <Badge variant="outline">{msToFormattedTime(coinzProCooldown)}</Badge>
                                </span>
                            </div>
                        ) : (
                            <Badge variant="outline">{msToFormattedTime(coinzProCooldown)}</Badge>
                        )}
                    </div>

                    {command.usage && command.usage.length > 0 && (
                        <div>
                            <h3 className="text-lg font-medium mb-1">Usage</h3>
                            <div className="code-copy flex flex-col gap-1 items-start">
                                {command.usage.map((usage, index) => (
                                    <code key={index}>
                                        /{command.name} {usage}
                                    </code>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
