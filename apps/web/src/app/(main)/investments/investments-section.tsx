'use client';

import { useState } from 'react';
import { Investment, InvestmentData } from '@prisma/client';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import CategoryCard from '@/components/category-card';
import Search from '@/components/Search';
import { cn } from '@/lib/utils';
import { ArrowUpDownIcon, TrendingDownIcon, TrendingUpIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const categories: { [key: string]: string } = {
    all: 'All',
    Stock: 'Stocks',
    Crypto: 'Crypto',
};

function getInvestments(list: Investment[], category: string, searchTerm: string): Investment[] {
    if (searchTerm) {
        return list.filter(
            (i) =>
                i.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
                i.fullName.toLowerCase().includes(searchTerm.toLowerCase()),
        );
    } else if (category === 'all') {
        return list;
    } else {
        return list.filter((i) => i.type === category);
    }
}

export default function InvestmentsSection({
    investments,
    data,
    userId,
    hasPremium,
}: {
    investments: Investment[];
    data: InvestmentData[];
    userId?: string;
    hasPremium: boolean;
}) {
    const [category, setCategory] = useState(Object.keys(categories)[0]!);
    const [searchTerm, setSearchTerm] = useState('');

    const { data: investmentData } = useQuery<Investment[]>({
        queryKey: ['investments'],
        queryFn: async () => {
            const res = await fetch('/api/investment');

            if (!res.ok) {
                toast.error('Failed to update investments');
                return investments as Investment[];
            }

            return res.json() as Promise<Investment[]>;
        },
        refetchInterval: 60_000,
        initialData: investments,
        initialDataUpdatedAt: Date.now(),
        staleTime: 60_000,
    });

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
                    placeholder="Search investments..."
                    searchTerm={searchTerm}
                    onChangeHandler={(e) => {
                        setSearchTerm(e.target.value);
                    }}
                />
            </div>

            <div
                className="grid gap-3"
                style={{
                    gridTemplateColumns: 'repeat(auto-fit, minmax(325px, 1fr))',
                }}
            >
                {getInvestments(investmentData, category, searchTerm).map((dataObj: Investment) => (
                    <InvestmentCard
                        key={dataObj.ticker}
                        investment={dataObj}
                        data={data}
                        userId={userId}
                        hasPremium={hasPremium}
                    />
                ))}
            </div>
        </div>
    );
}

function InvestmentCard({
    investment,
    data,
    userId,
    hasPremium,
}: {
    investment: Investment;
    data: InvestmentData[];
    userId?: string;
    hasPremium: boolean;
}) {
    const router = useRouter();
    const [tradingMode, setTradingMode] = useState<'amount' | 'price'>('amount');
    const [inputValue, setInputValue] = useState(0);
    const [amount, setAmount] = useState(0);
    const [price, setPrice] = useState(0);
    const [personalInvestment] = useState<InvestmentData | undefined>(data.find((i) => i.ticker === investment.ticker));
    const [personalChanged] = useState<string | undefined>(
        personalInvestment &&
            calculateProfitOrLoss(personalInvestment.amount, personalInvestment.buyPrice, investment.price),
    );

    function roundNumber(num: number, dec: number): number {
        const factor = 10 ** dec;
        const roundedNumber = Math.round((num + Number.EPSILON) * factor) / factor;
        return parseFloat(roundedNumber.toFixed(dec));
    }

    function calculateProfitOrLoss(amount: string, buyPrice: number, currentPrice: string): string {
        const totalCurrentValue = parseFloat(amount) * parseFloat(currentPrice);
        const profitOrLoss = totalCurrentValue - buyPrice;
        const profitOrLossPercentage = (profitOrLoss / buyPrice) * 100;
        return roundNumber(profitOrLossPercentage, 2) + '%';
    }

    async function buyOrSellInvestment(type: 'BUY' | 'SELL') {
        if (!userId) {
            toast.error(`You need to be logged in to ${type.toLowerCase()} investments.`);
            return;
        }

        const res = await fetch('/api/investment', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: userId,
                type,
                ticker: investment.ticker,
                amount,
            }),
        });

        const data = await res.json();
        if (!res.ok) {
            toast.error(data.error);
        } else {
            toast.success(`${data.message} Please refresh the page to see the changes.`);
            router.refresh();
        }
    }

    return (
        <Dialog>
            <DialogTrigger
                className="bg-secondary rounded-md p-4 flex flex-col justify-between gap-6 border border-transparent hover:border-highlight transition-all duration-150 ease-in-out focus:outline-none focus:border-primary"
                aria-label={`View ${investment.fullName} details`}
            >
                <div className="flex items-start">
                    <Image
                        src={`https://cdn.coinzbot.xyz/ticker/${investment.ticker}.png`}
                        alt="Investment company logo"
                        width={50}
                        height={50}
                        className="mr-4 rounded-md"
                    />

                    <div className="w-full text-left">
                        <h3 className="text-xl font-semibold">{investment.fullName}</h3>
                        <div className="flex items-center gap-2">
                            <p className="text-lg text-muted font-medium">{investment.ticker}</p>
                            <Badge variant="secondary" className="bg-background">
                                {investment.type}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1">
                        <Image
                            src="https://cdn.discordapp.com/emojis/987800268223709254.webp?size=24&quality=lossless"
                            alt="Coinz Currency"
                            width={24}
                            height={24}
                        />
                        <p className="font-semibold text-2xl">{investment.price}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {parseFloat(investment.changed) >= 0 ? (
                            <TrendingUpIcon className="text-green-600" />
                        ) : (
                            <TrendingDownIcon className="text-red-600" />
                        )}
                        <p
                            className={cn(
                                parseFloat(investment.changed) >= 0 ? 'text-green-600' : 'text-red-600',
                                'font-medium text-lg',
                            )}
                        >
                            {investment.changed}%
                        </p>
                    </div>
                </div>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-start">
                        <Image
                            src={`https://cdn.coinzbot.xyz/ticker/${investment.ticker}.png`}
                            alt="Investment company logo"
                            width={50}
                            height={50}
                            className="mr-4 rounded-md"
                        />

                        <div className="w-full">
                            <h3 className="text-xl font-semibold">{investment.fullName}</h3>
                            <div className="flex items-center gap-2">
                                <p className="text-lg text-muted font-medium">{investment.ticker}</p>
                                <Badge variant="secondary" className="bg-background">
                                    {investment.type}
                                </Badge>
                            </div>
                        </div>
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col justify-between gap-6">
                    <div className="flex justify-between gap-4 py-6">
                        <div className="flex flex-col gap-1 items-start">
                            <Badge className="mb-2" variant="secondary">
                                Current Price
                            </Badge>
                            <div className="flex items-center gap-1">
                                <Image
                                    src="https://cdn.discordapp.com/emojis/987800268223709254.webp?size=24&quality=lossless"
                                    alt="Coinz Currency"
                                    width={24}
                                    height={24}
                                />
                                <p className="font-semibold text-2xl">{investment.price}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {parseFloat(investment.changed) >= 0 ? (
                                    <TrendingUpIcon className="text-green-600" />
                                ) : (
                                    <TrendingDownIcon className="text-red-600" />
                                )}
                                <p
                                    className={cn(
                                        parseFloat(investment.changed) >= 0 ? 'text-green-600' : 'text-red-600',
                                        'font-medium text-lg',
                                    )}
                                >
                                    {investment.changed}%
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1 items-end">
                            <Badge className="mb-2" variant="secondary">
                                Your Holdings
                            </Badge>
                            <p className="text-muted text-sm -mb-1">
                                {personalInvestment ? roundNumber(parseFloat(personalInvestment.amount), 3) : '0'}x{' '}
                                {investment.type === 'Stock' ? 'Shares' : 'Coins'}
                            </p>
                            <div className="flex items-center gap-1">
                                <Image
                                    src="https://cdn.discordapp.com/emojis/987800268223709254.webp?size=24&quality=lossless"
                                    alt="Coinz Currency"
                                    width={24}
                                    height={24}
                                />
                                <p className="font-semibold text-2xl">
                                    {personalInvestment
                                        ? roundNumber(
                                              parseFloat(personalInvestment.amount) * parseFloat(investment.price),
                                              3,
                                          )
                                        : '0'}
                                </p>
                            </div>
                            {personalChanged && (
                                <div className="flex items-center gap-2 justify-end">
                                    {parseFloat(personalChanged) >= 0 ? (
                                        <TrendingUpIcon className="text-green-600" />
                                    ) : (
                                        <TrendingDownIcon className="text-red-600" />
                                    )}
                                    <p
                                        className={cn(
                                            parseFloat(investment.changed) >= 0 ? 'text-green-600' : 'text-red-600',
                                            'font-medium text-lg',
                                        )}
                                    >
                                        {personalChanged}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {hasPremium ? (
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-center items-center gap-1 text-lg font-medium">
                                <span>
                                    Buy or sell {amount} {investment.ticker} for
                                </span>
                                <Image
                                    src="https://cdn.discordapp.com/emojis/987800268223709254.webp?size=24&quality=lossless"
                                    alt="Coinz Currency"
                                    width={20}
                                    height={20}
                                    className="w-5 h-5"
                                />
                                <span>{price}</span>
                            </div>

                            <div className="flex gap-4 justify-between items-center">
                                <Input
                                    className="border-highlight focus-visible:ring-0"
                                    placeholder={tradingMode === 'amount' ? 'Amount' : 'Price'}
                                    type="number"
                                    value={inputValue}
                                    onChange={(e) => {
                                        let value = parseInt(e.target.value);
                                        if (Number.isNaN(value) || value < 0) {
                                            value = 0;
                                        }

                                        const investmentPrice = parseFloat(investment.price);
                                        if (tradingMode === 'amount' && value * investmentPrice > 1_000_000) {
                                            value = Math.floor(1_000_000 / investmentPrice);
                                        } else if (tradingMode === 'price' && value > 1_000_000) {
                                            value = 1_000_000;
                                        }

                                        setInputValue(value);
                                        if (tradingMode === 'amount') {
                                            setAmount(value);
                                            setPrice(Math.round(value * investmentPrice));
                                        } else {
                                            setPrice(value);
                                            setAmount(roundNumber(value / investmentPrice, 3));
                                        }
                                    }}
                                />

                                <div className="flex gap-4 items-center flex-grow">
                                    <button
                                        onClick={() => {
                                            setTradingMode(tradingMode === 'amount' ? 'price' : 'amount');
                                            setInputValue(0);
                                            setAmount(0);
                                            setPrice(0);
                                        }}
                                    >
                                        <ArrowUpDownIcon className="text-muted" size={20} />
                                    </button>
                                    {tradingMode === 'amount' ? (
                                        <div className="flex gap-2 items-center">
                                            <Image
                                                src="https://cdn.discordapp.com/emojis/987800268223709254.webp?size=24&quality=lossless"
                                                alt="Coinz Currency"
                                                width={24}
                                                height={24}
                                                className="w-6 h-6"
                                            />
                                            <p className="text-lg font-medium">{price}</p>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2 items-center">
                                            <p className="text-lg font-medium">{amount}</p>
                                            <p>{investment.type === 'Stock' ? 'Shares' : 'Coins'}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 justify-between">
                                <Button
                                    variant="destructive"
                                    className="w-full"
                                    onClick={() => buyOrSellInvestment('SELL')}
                                >
                                    Sell
                                </Button>
                                <Button
                                    variant="secondary"
                                    className="w-full bg-green-600 hover:bg-green-600/90"
                                    onClick={() => buyOrSellInvestment('BUY')}
                                >
                                    Buy
                                </Button>
                            </div>
                            {investment.type === 'Stock' && (
                                <Link
                                    href={`https://www.tradingview.com/chart/?symbol=${investment.ticker}`}
                                    className="w-full"
                                    target="_blank"
                                >
                                    <Button className="w-full border-highlight" variant="secondary">
                                        Advanced Graph
                                    </Button>
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 items-center">
                            <p className="text-lg text-center text-red-500 font-semibold">
                                You need Coinz Pro to buy or sell investments.
                            </p>
                            <Link href="/premium">
                                <Button>Get Coinz Pro</Button>
                            </Link>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
