import Bot from "./Bot";

export default interface IEvent {
    name: string;
    once: boolean;

    execute: (client: Bot, ...args: any[]) => Promise<void>;
}