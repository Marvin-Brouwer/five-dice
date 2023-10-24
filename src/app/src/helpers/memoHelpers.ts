import { Accessor, createMemo } from 'solid-js'
export const not = (accessor: Accessor<boolean>): Accessor<boolean> => createMemo(() => !accessor(), accessor)