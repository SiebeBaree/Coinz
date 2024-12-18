import { SearchIcon } from 'lucide-react';
import React from 'react';

export default function Search({
    placeholder,
    searchTerm,
    onChangeHandler,
}: {
    placeholder?: string;
    searchTerm: string;
    onChangeHandler: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
    return (
        <div className="flex items-center rounded overflow-hidden bg-secondary px-3 py-2 min-w-full md:min-w-[250px]">
            <SearchIcon className="text-primary" />
            <input
                type="text"
                placeholder={placeholder || 'Search...'}
                value={searchTerm}
                onChange={onChangeHandler}
                className="w-full pl-2 border-none outline-none bg-transparent text-foreground"
            />
        </div>
    );
}
