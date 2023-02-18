import { dirname, join } from "path";
import { readdirSync } from "fs";

export default class Handler {
    private _files: string[] = [];

    get files(): string[] {
        return this._files;
    }

    public addFile(file: string): void {
        this._files.push(file);
    }

    public addFiles(files: string[]): void {
        this._files.push(...files);
    }

    public getFullPath(path: string): string {
        return join(dirname(__dirname), path);
    }

    public getDirectories(path: string, privateFolders: string[] = []): string[] {
        const entries = readdirSync(this.getFullPath(path), { withFileTypes: true });
        const directories: string[] = [];

        for (const file of entries) {
            if (file.isDirectory()) {
                if (privateFolders.includes(file.name.toLowerCase())) {
                    continue;
                }

                directories.push(path + file.name);
            }
        }

        return directories;
    }

    public getFiles(directory: string): string[] {
        directory = directory.endsWith("/") ? directory : directory + "/";

        const entries = readdirSync(this.getFullPath(directory), { withFileTypes: true });
        const files: string[] = [];

        for (const file of entries) {
            if (file.isFile()) {
                if (file.name.endsWith(".ts") || file.name.endsWith(".js")) {
                    files.push(directory + file.name);
                }
            }
        }

        return files;
    }
}