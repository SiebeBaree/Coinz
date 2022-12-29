/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable semi */
export default interface IEvent {
    name: string;

    execute: (...args: any[]) => Promise<void>;
}
