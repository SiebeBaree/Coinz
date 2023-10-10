"use client";

import { useState } from "react";
import { Investment } from "@prisma/client";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import CategoryCard from "@/components/CategoryCard";
import Search from "@/components/Search";
import { cn } from "@/lib/utils";
import TrendingUpIcon from "@/components/icons/TrendingUp";
import TrendingDownIcon from "@/components/icons/TrendingDown";

const categories: { [key: string]: string } = {
    all: "All",
    Stock: "Stocks",
    Crypto: "Crypto",
};

function getInvestments(list: Investment[], category: string, searchTerm: string) {
    if (searchTerm) {
        return list.filter((i) => i.ticker.toLowerCase().includes(searchTerm.toLowerCase()) || i.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
    } else if (category === "all") {
        return list;
    } else {
        return list.filter((i) => i.type === category);
    }
}

export default function InvestmentsSection({ data }: {
    data: Investment[];
}) {
    const [category, setCategory] = useState(Object.keys(categories)[0]);
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div className="flex flex-col gap-6 mb-12">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    {Object.keys(categories).map((name) => (
                        <CategoryCard key={name} name={categories[name]} value={name} selectedCategory={category}
                                      setCategory={setCategory}/>
                    ))}
                </div>

                <Search placeholder="Search investments..." searchTerm={searchTerm} onChangeHandler={(e) => {
                    setSearchTerm(e.target.value);
                }}/>
            </div>

            <div className="grid gap-4" style={{
                gridTemplateColumns: "repeat(auto-fit, minmax(325px, 1fr))",
            }}>
                {getInvestments(data, category, searchTerm).map((dataObj: Investment) => (
                    <InvestmentCard key={dataObj.ticker} investment={dataObj}/>
                ))}
            </div>
        </div>
    );
}

function InvestmentCard({ investment }: {
    investment: Investment;
}) {
    return (
        <div
            className="bg-secondary rounded-md p-4 flex flex-col justify-between gap-6 border border-transparent hover:border-highlight transition-all duration-150 ease-in-out">
            <div className="flex items-start">
                <Image src={`https://cdn.coinzbot.xyz/ticker/${investment.ticker}.png`} alt="Investment company logo"
                       width={50} height={50}
                       className="mr-4 rounded-md"/>

                <div className="w-full">
                    <h3 className="text-xl font-semibold">{investment.fullName}</h3>
                    <div className="flex items-center gap-2">
                        <p className="text-lg text-muted font-medium">{investment.ticker}</p>
                        <Badge variant="secondary" className="bg-background">{investment.type}</Badge>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                    <Image src="https://cdn.discordapp.com/emojis/987800268223709254.webp?size=24&quality=lossless"
                           alt="Coinz Currency" width={24} height={24}/>
                    <p className="font-semibold text-2xl">{investment.price}</p>
                </div>
                <div className="flex items-center gap-2">
                    {parseFloat(investment.changed) >= 0 ? (
                        <TrendingUpIcon className="fill-green-600"/>
                    ) : (
                        <TrendingDownIcon className="fill-red-600"/>
                    )}
                    <p className={cn(parseFloat(investment.changed) >= 0 ? "text-green-600" : "text-red-600", "font-medium text-lg")}>{investment.changed}%</p>
                </div>
            </div>
        </div>
    );
}