import { IconProps } from "@/lib/interfaces";

export default function ChevronDownIcon(props: IconProps) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className={props.className}
             style={props.style}>
            <path d="M16.293 9.293 12 13.586 7.707 9.293l-1.414 1.414L12 16.414l5.707-5.707z" fill={props.fill}/>
        </svg>
    );
}