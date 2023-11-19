import CommandSection from "@/app/commands/CommandSection";
import PageTitle from "@/components/PageTitle";

export default function CommandsPage() {
    return (
        <>
            <PageTitle title="Commands"
                       description="You'll find a comprehensive list of all the available commands for Coinz. We've compiled this list to help you quickly and easily access the commands in Coinz effectively."/>
            <CommandSection/>
        </>
    )
        ;
}