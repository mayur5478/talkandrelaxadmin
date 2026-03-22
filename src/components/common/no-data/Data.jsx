import React from 'react'
import "./data.scss"
import dataImage from "../../assets/no-data.png"
function Data() {
  return (
    <div className='data-main'>
<img src={dataImage} alt={dataImage} />
<p>No Data Available  in Table</p>
    </div>
  )
}

export default Data