import { redirect } from "next/navigation";

export default function InvitePage() {
    return redirect("https://discord.com/oauth2/authorize?client_id=938771676433362955&permissions=313344&scope=bot%20applications.commands");
}