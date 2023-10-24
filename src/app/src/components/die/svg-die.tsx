import './die.css'
import './text-die.css'

import type { Component } from 'solid-js'

interface Props {
    value: string,
    description?: string,
    tabindex?: number 
}

export const SvgDie : Component<Props> = ({ value, description, tabindex }) => (
	<span class="die" aria-valuetext={description} tabindex={tabindex?.toString()}>
		<span class="text" innerHTML={value} />
	</span>
)