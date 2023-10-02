import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function copyCode() {
    const codeElements = document.querySelectorAll("code");

    codeElements.forEach(element => {
        element.addEventListener("click", () => {
            if (element.textContent != null) {
                navigator.clipboard.writeText(element.textContent).then(() => {
                    element.setAttribute("data-tooltip", "Copied!");
                });
            }
        });

        element.addEventListener("mouseout", () => {
            element.setAttribute("data-tooltip", "Click to copy");
        });
    });
}