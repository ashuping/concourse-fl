import React from 'react'

import { Link } from 'react-router-dom'

import { Home, User } from 'react-feather'

function Header({title}){
	return <div className="header">
		<table><tbody><tr>
			<td><Link path to="/"><Home /></Link></td>
			<th>{title}</th>
			<td><Link path to="/login"><User /></Link></td>
		</tr></tbody></table>
	</div>
}

export default Header