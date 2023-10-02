"use client";

import ReactMarkdown from "react-markdown";
import changelog from "@/lib/data/changelog.json";
import { Changelog } from "@/lib/interfaces";
import { useEffect } from "react";
import { copyCode } from "@/lib/utils";

export default function ChangelogSection({ data }: {
    data: Changelog[];
}) {
    useEffect(() => {
        copyCode();
    }, []);

    return (
        <div className="flex flex-col gap-8 mb-12">
            {changelog.map((item: Changelog, index: number) => (
                <ChangelogCard key={index} update={item}/>
            ))}
        </div>
    );
}

function ChangelogCard({ update }: { update: Changelog }) {
    return (
        <div id={`v${update.version}`} className="bg-secondary rounded-lg px-6 py-4">
            <div className="flex justify-between items-center gap-8">
                <h3 className="font-semibold text-2xl">{update.name}</h3>
                <h4 className="font-bold text-muted text-xl">v{update.version}</h4>
            </div>
            <div className="formatted-text my-4 code-copy">
                {update.content.map((line: string, index: number) => (
                    <ReactMarkdown key={update.name + "-" + index}>{line}</ReactMarkdown>
                ))}
            </div>

            <h4 className="text-muted text-sm">Update posted
                on: {new Date(update.timestamp * 1000).toDateString()}</h4>
        </div>
    );
}