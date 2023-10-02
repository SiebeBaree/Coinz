import CommandSection from "@/app/commands/CommandSection";

export default function CommandsPage() {
    return (
        <main className="container mx-auto px-5">
            <div className="page-title">
                <h2 className="watermark">Commands</h2>
                <h1>Commands</h1>
                <p>You&apos;ll find a comprehensive list of all the available commands for Coinz. We&apos;ve
                    compiled this list to help you quickly and easily access the commands in Coinz effectively.</p>
            </div>

            <CommandSection />
        </main>
    );
}