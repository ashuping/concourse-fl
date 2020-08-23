/* City of Concourse Website - Speed indicator
	Copyright 2020 Alex Isabelle Shuping

	Licensed under the Apache License, Version 2.0 (the "License");
	you may not use this file except in compliance with the License.
	You may obtain a copy of the License at

		http://www.apache.org/licenses/LICENSE-2.0

	Unless required by applicable law or agreed to in writing, software
	distributed under the License is distributed on an "AS IS" BASIS,
	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	See the License for the specific language governing permissions and
	limitations under the License.
 */

import React from 'react'
import { Loader } from 'react-feather'

import { calc_dio_mod } from '../../../util/DIO.js'

import './SpeedBar.css'

function SpeedBar({speed}){

    let sprefix = "SPEED  "
    if(speed > 0){
        sprefix += "+"
    }else if(speed < 0){
        sprefix += "-"
    }

    const dio = calc_dio_mod(speed)

    return <div className="cbox-speedbar">
        <div className="speedbar-val">{sprefix}{Math.abs(speed)}</div>
        <div className="speedbar-spacer" />
        <div className="speedbar-box-container">
            <div className="speedbar-bar" style={{animationDuration: `${1/dio}s`}} />
        </div>
    </div>
}

export default SpeedBar