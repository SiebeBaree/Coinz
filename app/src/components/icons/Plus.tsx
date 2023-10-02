import { IconProps } from "@/lib/interfaces";

export default function PlusIcon(props: IconProps) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className={props.className} style={props.style}>
            <path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z" fill={props.fill}/>
        </svg>
    );
}