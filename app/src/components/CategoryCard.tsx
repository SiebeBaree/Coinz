import { cn } from "@/lib/utils";

export default function CategoryCard({ name, value, selectedCategory, setCategory }: {
    name: string,
    value: string,
    selectedCategory: string,
    setCategory: (category: string) => void,
}) {
    return (
        <button onClick={() => setCategory(value)}
                className={cn(selectedCategory === value ? "bg-primary text-primary-foreground" : "bg-secondary", "px-5 py-1 rounded font-medium transition-all duration-200 ease-in-out hover:bg-primary hover:text-primary-foreground")}>{name}</button>
    );
}