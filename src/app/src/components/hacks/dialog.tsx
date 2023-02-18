import './dialog.css'

import { Component, onCleanup, onMount, Signal, ParentProps, children, Accessor } from 'solid-js';
import { createEffect } from 'solid-js';

type Props = {
    dialogState: Signal<boolean>
    modal: boolean
    id?: string,
    showBackdrop?: Accessor<boolean>,
    class?: string | undefined,
    hide?: Accessor<boolean>,
}

export const Dialog: Component<ParentProps<Props>> = ({ 
    dialogState, id, class: className, modal, children: childElements, hide, showBackdrop
}) => {

    let dialogReference: HTMLDialogElement;

    const [open, setOpen] = dialogState;
    const show = modal
        ? () => dialogReference.showModal()
        : () => dialogReference.show();

    function dialogClick(e:MouseEvent) {
        if (!e.target) return true;
        if (e.target !== dialogReference) return true;
        e.stopImmediatePropagation();
        e.stopPropagation();
        e.preventDefault();

        setOpen(false);
        return false;
    }

    onMount(() => {
        if (modal) dialogReference.addEventListener('click', dialogClick);
        
        if (!hide?.() && open()) show();
    })
    onCleanup(() => {
        if (modal) dialogReference.removeEventListener('click', dialogClick);

        dialogReference.close();
    })
    createEffect(() => {
        if (open()) {
            show();
            return;
        }
        dialogReference.close();
    }, open)

    const unwrappedChildren = children(() => childElements);
    return (
        <dialog id={id} ref={dialogReference!} 
            data-show-backdrop={showBackdrop?.() ?? true}
            aria-open={open()}
            onClose={() => setOpen(false)}
            class={className} aria-hidden={hide?.() ? true : false}>
            {unwrappedChildren()}
        </dialog>
    )
}