import type { Component } from "solid-js";
import type { Row } from "./die";

interface Props {
    row: Row, 
    columnName: keyof Row
}

export const DieDot : Component<Props> = ({ row, columnName }) => {

    const showDot = row[columnName];

    return (
        <span 
            class={showDot ? "dot" : "dot-space"} 
            style={`grid-area:${row.name}-${columnName}`} 
            aria-atomic="true" 
            aria-role="presentation"
            aria-hidden="true" 
            onselect={(e) => { e.preventDefault(); return false; }}
            innerHTML={showDot && "<!-- • -->" || ""}
        />
    )
};