import './dialog.css'

import { Component, onCleanup, onMount, Signal, ParentProps, children, Accessor, createSignal, createReaction } from 'solid-js';
import { createEffect } from 'solid-js';
import { isServerSide } from '../../helpers/utilities';

export type DialogSignal = DialogState & {
    openDialog: () => void;
}
export type DialogState = {
    isOpen: Accessor<boolean>,
    closeDialog: (fireEvents?: boolean) => void;
}
export const createDialogSignal = (onClose?: () => void, onBeforeClose?: () => void) => {
    const openState = createSignal(false);
    const [isOpen,setIsOpen] = openState;
    const openDialog = () => setIsOpen(true);
    const closeDialog = (fireEvents?: boolean) => {
        if (fireEvents !== false)
            onBeforeClose?.()
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
    closeOnClick?: boolean,
    showBackdrop?: Accessor<boolean>,
    class?: string | undefined,
    hide?: Accessor<boolean>,
}

export const Dialog: Component<ParentProps<Props>> = ({
    dialogState, id, class: className, modal, children: childElements, hide, showBackdrop, closeOnClick
}) => {

    let dialogReference: HTMLDialogElement;

    function show() {
        if (dialogReference.getAttribute('open') === 'open') return;

        try{
            modal ? dialogReference.showModal() : dialogReference.show();
        } catch {
            //
        }
    }

    function dialogClick(e:MouseEvent) {

        if (!e.target) return true;

        e.stopImmediatePropagation();
        e.stopPropagation();
        e.preventDefault();

        dialogState.closeDialog();
        return false;
    }

    onMount(() => {
        if (!hide?.() && dialogState.isOpen()) show();
    })
    onCleanup(() => {
        dialogReference?.close();
    })
    createEffect(() => {
        // These animations are just here to slightly mitigate the dialog flash
        if (dialogState.isOpen()) {
            setTimeout(() => dialogReference.style.opacity = ".2", 0);
            setTimeout(() => show(), 10);
            setTimeout(() => dialogReference.style.opacity = ".5", 50);
            setTimeout(() => dialogReference.style.opacity = "1", 90);
        }
        else {
            setTimeout(() => dialogReference.style.opacity = ".5", 50);
            setTimeout(() => dialogReference.style.opacity = ".2", 70);
            setTimeout(() => dialogReference.close(), 90);
            setTimeout(() => dialogReference.style.opacity = "1", 91);
        }
    }, dialogState.isOpen)


    function handleUnload(e: BeforeUnloadEvent) {

        if (!dialogState.isOpen()) return true;

        e.preventDefault();
        return e.returnValue = 'You\'re still entering a score, are you sure you want to reload the page?';
    }
    onMount(() => {
		if (isServerSide()) return;
        window.addEventListener('beforeunload', handleUnload)
    })
    onCleanup(() => {
		if (isServerSide()) return;
        document.removeEventListener('beforeunload', handleUnload)
    })

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
            {modal && closeOnClick
                ? <div class='click-backdrop' onClick={dialogClick} />
                : undefined
            }
            {unwrappedChildren()}
        </dialog>
    )
}