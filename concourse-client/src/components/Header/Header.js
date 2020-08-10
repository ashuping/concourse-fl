import React from 'react'

import { Link } from 'react-router-dom'

import { Home, User } from 'react-feather'

function Header({title}){
	return <div className="header">
		<table><tbody><tr>
			<td><Link to="/dashboard"><Home /></Link></td>
			<th>{title}</th>
			<td><Link to="/profile"><User /></Link></td>
		</tr></tbody></table>
	</div>
}

export default Header