import { Component, onCleanup, onMount, createDeferred, Signal, ParentProps, children, Accessor, createMemo } from 'solid-js';
import { createEffect } from 'solid-js';

type Props = {
    dialogState: Signal<boolean>
    modal: boolean
    id: string,
    class?: string | undefined,
    hide?: Accessor<boolean>
}

export const Dialog: Component<ParentProps<Props>> = ({ 
    dialogState, id, class: className, modal, children: childElements, hide 
}) => {

    const dialogElement = createDeferred(() => document.querySelector<HTMLDialogElement>(`dialog#${id}`)!);

    const [open, setOpen] = dialogState;
    const show = modal
        ? () => dialogElement().showModal()
        : () => dialogElement().show();

    function dialogClick(e:MouseEvent) {
        if (!e.target) return;
        if (e.target !== dialogElement()) return;

        setOpen(false);
    }

    onMount(() => {
        if (modal) dialogElement().addEventListener('click', dialogClick);
        
        if (!hide?.() && open()) show();
    })
    onCleanup(() => {
        if (modal) dialogElement().removeEventListener('click', dialogClick);

        dialogElement().close();
    })
    createEffect(() => {
        if (open()) {
            show();
            return;
        }
        dialogElement().close();
    }, open)

    const unwrappedChildren = children(() => childElements);
    return (
        <dialog id={id} class={className} aria-hidden={hide?.() ? true : false}>
            {unwrappedChildren()}
        </dialog>
    )
}