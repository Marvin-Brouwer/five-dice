import type { Component } from 'solid-js'
import type { Face } from './die'
import { DieDot } from './die-dot'

interface Props {
    face: Face, 
    rowName: keyof Face
}

export const DieRow : Component<Props> = ({ face, rowName }) => {
    
	const row = face[rowName]

	return (<>
		<DieDot row={row} columnName="left" />
		<DieDot row={row} columnName="middle" />
		<DieDot row={row} columnName="right" />
	</>)
}