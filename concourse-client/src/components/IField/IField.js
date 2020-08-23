import React, { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, Circle } from 'react-feather'
import './IField.css'

function IField({changeCallback, name, help_text, good_text, bad_text, good, i_type}){
	const [empty, set_empty] = useState(true)

	if(!i_type){
		i_type = 'text'
	}

	function changeCBWrapper(event){
		if(event.target.value){
			set_empty(false)
		}else{
			set_empty(true)
		}

		changeCallback(event)
	}

	let status_elem = <td><span className="ifield ifield-empty" title="Field is empty"><Circle /></span></td>
	if(!empty){
		status_elem = <td><span className="ifield ifield-good" title={good_text}><CheckCircle /></span></td>
	}
	if(!good){
		status_elem = <td><span className="ifield ifield-bad" title={bad_text}><AlertCircle /></span></td>
	}

	return <tr className="ifield">
		<td><span title={help_text}>{name}</span></td>
		<td className="ifield-tbox"><input type={i_type} onChange={changeCBWrapper} placeholder={name} /></td>
		{status_elem}
	</tr>
}

export function IField_Flexbox({changeCallback, name, help_text, good_text, bad_text, good, i_type, default_val, disabled}){
	const [empty, set_empty] = useState(true)

	useEffect(() => {
		set_empty((default_val !== undefined && default_val !== null && default_val.toString().length > 0) ? false : true)
	}, [default_val, set_empty])

	if(!i_type){
		i_type = 'text'
	}

	if(!disabled === null){
		disabled = false
	}

	function changeCBWrapper(event){
		if(event.target.value !== null && event.target.value.length > 0){
			set_empty(false)
		}else{
			set_empty(true)
		}

		changeCallback(event)
	}

	let status_elem = <div className="ifield-right"><span className="ifield-empty" title="Field is empty"><Circle /></span></div>
	if(!empty){
		status_elem = <div className="ifield-right"><span className="ifield-good" title={good_text}><CheckCircle /></span></div>
	}
	if(!good){
		status_elem = <div className="ifield-right"><span className="ifield-bad" title={bad_text}><AlertCircle /></span></div>
	}

	return <div className="ifield ifield-flex">
		<div className="ifield-left"><span title={help_text}>{name}</span></div>
		<div className="ifield-center"><input disabled={disabled} type={i_type} onChange={changeCBWrapper} placeholder={help_text} defaultValue={default_val} /></div>
		{status_elem}
	</div>
}

export default IField