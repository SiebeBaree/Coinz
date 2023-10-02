"use client";

import { useEffect, useRef, useState } from "react";
import ChevronDownIcon from "@/components/icons/ChevronDown";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

export default function FaqCard({ title, description }: {
    title: string;
    description: string;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.style.maxHeight = isOpen ? `${contentRef.current.scrollHeight}px` : "0";
        }
    }, [isOpen]);

    return (
        <div
            className={cn(isOpen ? "border-highlight" : "border-1 border-transparent", "flex flex-col justify-center bg-secondary rounded-md px-5 py-2")}>
            <div onClick={() => setIsOpen(!isOpen)}
                 className={cn(isOpen && "pb-1", "flex justify-between items-center gap-3 select-none cursor-pointer transition-all duration-300 ease-in-out")}>
                <h4 className="font-medium text-2xl">{title}</h4>
                <ChevronDownIcon
                    className="fill-primary h-12 w-12 transition-all duration-300 ease-in-out" style={{
                    transform: `rotate(${isOpen ? "180deg" : "0"})`,
                }}/>
            </div>

            <div ref={contentRef}
                 className={cn(isOpen && "mb-1", "max-h-0 overflow-hidden transition-all duration-300 ease-in-out formatted-text")}>
                <ReactMarkdown>{description}</ReactMarkdown>
            </div>
        </div>
    );
}