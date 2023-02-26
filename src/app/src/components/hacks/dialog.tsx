import './dialog.css'

import { Component, onCleanup, onMount, Signal, ParentProps, children, Accessor, createSignal } from 'solid-js';
import { createEffect } from 'solid-js';

export type DialogSignal = DialogState & {
    openDialog: () => void;
}
export type DialogState = {
    isOpen: Accessor<boolean>
    closeDialog: (fireEvents?: boolean) => void;
}
export const createDialogSignal = (onClose?: () => void | undefined) => {
    const state = createSignal(false);
    const [isOpen,setIsOpen] = state;
    const openDialog = () => setIsOpen(true);
    const closeDialog = (fireEvents?: boolean) => {
        setIsOpen(false);
        if (fireEvents !== false)
            onClose?.();
    }
    return {
        isOpen,
        openDialog,
        closeDialog
    }
}
type Props = {
    dialogState: DialogState
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

    const show = modal
        ? () => dialogReference.showModal()
        : () => dialogReference.show();

    function dialogClick(e:MouseEvent) {
        if (!e.target) return true;
        if (e.target !== dialogReference) return true;
        e.stopImmediatePropagation();
        e.stopPropagation();
        e.preventDefault();

        dialogState.closeDialog();
        return false;
    }

    onMount(() => {
        if (modal) dialogReference.addEventListener('click', dialogClick);
        
        if (!hide?.() && dialogState.isOpen()) show();
    })
    onCleanup(() => {
        if (modal) dialogReference.removeEventListener('click', dialogClick);

        dialogReference.close();
    })
    createEffect(() => {
        if (dialogState.isOpen()) {
            show();
            return;
        }
        dialogReference.close();
    }, dialogState.isOpen)

    const unwrappedChildren = children(() => childElements);
    return (
        <dialog id={id} ref={dialogReference!} 
            data-show-backdrop={showBackdrop?.() ?? true}
            aria-open={dialogState.isOpen()}
            onClose={() => {
                if (!dialogState.isOpen()) return;
                dialogState.closeDialog();
            }}
            class={className} aria-hidden={hide?.() ? true : false}>
            {unwrappedChildren()}
        </dialog>
    )
}