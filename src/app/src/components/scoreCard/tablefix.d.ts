import "solid-js";
import * as origSolid from "solid-js";
import type { JSX } from "solid-js";

declare module "solid-js" {
    declare namespace JSX {
        interface HTMLAttributes<T extends HTMLTableElement> extends 
            origSolid.JSX.HTMLAttributes<T>, origSolid.JSX.AriaAttributes, origSolid.JSX.DOMAttributes<T>  {
            border?: number
            frame?: number
        }
        export interface HTMLElementTags extends origSolid.JSX.HTMLElementTags {
            table: HTMLAttributes<HTMLTableElement> & origSolid.JSX.HTMLElementTags['table']
            tbody: origSolid.JSX.HTMLAttributes<HTMLTableSectionElement>;
            td: origSolid.JSX.TdHTMLAttributes<HTMLTableCellElement>;
            tfoot: origSolid.JSX.HTMLAttributes<HTMLTableSectionElement>;
            th: origSolid.JSX.ThHTMLAttributes<HTMLTableCellElement>;
            thead: origSolid.JSX.HTMLAttributes<HTMLTableSectionElement>;
            tr: origSolid.JSX.HTMLAttributes<HTMLTableRowElement>;
            col: origSolid.JSX.ColHTMLAttributes<HTMLTableColElement>;
            colgroup: origSolid.JSX.ColgroupHTMLAttributes<HTMLTableColElement>;
        }
    }
    
}