import React from 'react';
import './dashboardCard.scss';

import user from '../../assets/blue-user.png';
import headphone from '../../assets/purple-headphone.png';
import yellowAmount from '../../assets/yellow-amount.png';
import greenAmount from '../../assets/green-amount.png';
import purpleAmount from '../../assets/purple-amount.png';
import soilGreenAmount from '../../assets/soil-green-amount.png';
import brownAmount from '../../assets/brown-amount.png';
import greyAmount from '../../assets/grey-amount.png';
import ups from '../../assets/ups.png';
import down from '../../assets/down.png';


const iconMap = {
  user,
  headphone,
  yellowAmount,
  greenAmount,
  purpleAmount,
  soilGreenAmount,
  brownAmount,
  greyAmount,
};

function DashboardCards({
  title,
  amount,
  percentage,
  icon,
  growth,
  growthClass,
  backgroundClass,
  type
}) {
  const iconSrc = iconMap[icon] || user; 
  const growthIcon = growth === 'ups' ? ups : down;

  return (
    <div className='dashboard-card'>
      <div className='card-left-sec'>
        <p className='title'>{title}</p>
        {type === 'gst' || type === 'revenue' ? (
          <p className='gst-amount'>{amount}</p>
        ) : (
          <p className='amount'>{amount}</p>
        )}
        {type === 'dashboard' && (
          <p className={`percentage ${growthClass}`}>
            <img className='growth-text' src={growthIcon} alt={growth} />
            {percentage}
          </p>
        )}
      </div>
      <div className={`card-right-sec ${backgroundClass}`}>
        <img src={iconSrc} alt={icon} />
      </div>
    </div>
  );
}

export default DashboardCards;
